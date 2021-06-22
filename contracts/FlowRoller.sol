// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import {
    ISuperfluid,
    ISuperToken,
    ISuperApp,
    ISuperAgreement,
    SuperAppDefinitions
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import {
    IConstantFlowAgreementV1
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

import {
    SuperAppBase
} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";

contract FlowRoller is SuperAppBase {

    struct Saver {
        uint256 timestamp;
        int96 flowRate;
        uint256 prevAccumulatedBalance;
        bool isTerminated;
    }

    mapping(address => Saver) public savers;

    ISuperfluid private _host; // host
    IConstantFlowAgreementV1 public immutable _cfa;
    ISuperToken public immutable _superToken;

    constructor(
        ISuperfluid host,
        IConstantFlowAgreementV1 cfa,
        ISuperToken superToken
    ) 
    {
        require(address(host) != address(0), "Auction: host is empty");
        require(address(cfa) != address(0), "Auction: cfa is empty");
        require(address(superToken) != address(0), "Auction: superToken is empty");
        _host = host;
        _cfa = cfa;
        _superToken = superToken;

        uint256 configWord =
            SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;
        _host.registerApp(configWord);
    }

    /**************************************************************************
     * flowroller functions
     *************************************************************************/

    function _initiateSaver(
        bytes calldata ctx, 
        bytes calldata agreementData, 
        bytes32 agreementId)
        private
        returns(bytes memory newCtx) 
    {
        newCtx = ctx;
        (address from,) = abi.decode(agreementData, (address, address));
        (uint256 timestamp, int96 flowRate,,) = _cfa.getFlowByID(_superToken, agreementId);

        savers[from].timestamp = timestamp;
        savers[from].flowRate = flowRate;
        savers[from].prevAccumulatedBalance = 0;
        savers[from].isTerminated = false;
    }

    function _updateSaver(
        bytes calldata ctx, 
        bytes calldata agreementData, 
        bytes32 agreementId) 
        private
        returns(bytes memory newCtx) 
    {
        newCtx = ctx;
        (address from,) = abi.decode(agreementData, (address, address));

        uint256 prevTimestamp = savers[from].timestamp;
        int96 prevFlowRate = savers[from].flowRate;

        (uint256 updatedTimestamp, int96 updatedFlowRate,,) = _cfa.getFlowByID(_superToken, agreementId);

        uint256 timeDelta = updatedTimestamp - prevTimestamp;
        uint256 newAccumulatedBalance = savers[from].prevAccumulatedBalance + (timeDelta * uint256(prevFlowRate));

        // Update balance
        savers[from].prevAccumulatedBalance = newAccumulatedBalance;

        // Update other properties
        savers[from].timestamp = updatedTimestamp;
        savers[from].flowRate = updatedFlowRate;
        
        if (updatedFlowRate == 0) {
            savers[from].isTerminated = true;
            
            // TODO: send accumulated to AAVE here;
        }
        else {
            savers[from].isTerminated = false;
        }
    }

    /**************************************************************************
     * SuperApp callbacks
     * https://github.com/superfluid-finance/protocol-monorepo/tree/master/packages/ethereum-contracts
     *************************************************************************/

    function afterAgreementCreated(
        ISuperToken superToken,
        address agreementClass,
        bytes32 agreementId,
        bytes calldata agreementData,
        bytes calldata /*cbdata*/,
        bytes calldata ctx
    )
    external
    override
    onlyHost
    onlyExpected(superToken, agreementClass)
    returns (bytes memory newCtx)
    {
        return _initiateSaver(ctx, agreementData, agreementId);
    }

    function afterAgreementUpdated(
        ISuperToken superToken,
        address agreementClass,
        bytes32 agreementId,
        bytes calldata agreementData,
        bytes calldata /*cbdata*/,
        bytes calldata ctx
    )
    external
    override
    onlyHost
    onlyExpected(superToken, agreementClass)
    returns (bytes memory newCtx)
    {
        return _updateSaver(ctx, agreementData, agreementId);
    }

    function afterAgreementTerminated(
        ISuperToken superToken,
        address agreementClass,
        bytes32 agreementId,
        bytes calldata agreementData,
        bytes calldata /*cbdata*/,
        bytes calldata ctx
    )
    external
    override
    onlyHost
    returns (bytes memory newCtx) {
        return _updateSaver(ctx, agreementData, agreementId);
    }

    function _isSameToken(ISuperToken superToken) private view returns (bool) {
        return address(superToken) == address(_superToken);
    }

    function _isCFAv1(address agreementClass) private view returns (bool) {
        return ISuperAgreement(agreementClass).agreementType()
        == keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1");
    }

    /*Modifier*/
    modifier onlyHost() {
        require(msg.sender == address(_host), "Auction: support only one host");
        _;
    }

    modifier onlyExpected(ISuperToken superToken, address agreementClass) {
        require(_isSameToken(superToken), "Auction: not accepted token");
        require(_isCFAv1(agreementClass), "Auction: only CFAv1 supported");
        _;
    }
}