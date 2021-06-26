// SPDX-License-Identifier: MIT
pragma solidity ^0.7.5;
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

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";

import "hardhat/console.sol";

contract FlowRoller is SuperAppBase {

    struct Saver {
        uint256 timestamp;
        int96 flowRate;
        uint256 prevAccumulatedBalance;
        bool isTerminated;
    }

    using SafeMath for uint256;

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
        
        console.logBytes32(agreementId);
        (address from,) = abi.decode(agreementData, (address, address));
        (uint256 timestamp, int96 flowRate,,) = _cfa.getFlowByID(_superToken, agreementId);
        console.log("updatedTimestamp");
        console.logUint(timestamp);
        console.log("updatedFlowRate");
        console.logInt(flowRate);

        getBalance(from);

        savers[from].timestamp = timestamp;
        savers[from].flowRate = flowRate;
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

        console.logBytes32(agreementId);

        (address from,) = abi.decode(agreementData, (address, address));

        uint256 prevTimestamp = savers[from].timestamp;
        int96 prevFlowRate = savers[from].flowRate;

        (uint256 updatedTimestamp, int96 updatedFlowRate,,) = _cfa.getFlowByID(_superToken, agreementId);

        if (updatedFlowRate == 0) {
            // Flow has been terminated
            // Get timestamp from 'ctx' instead - flowData object timestamp will be 0
            // TODO: send accumulated to AAVE here;
            console.log("deleting flow...");
            savers[from].isTerminated = true;
            ISuperfluid.Context memory ctxDecoded = _host.decodeCtx(ctx);
            updatedTimestamp = ctxDecoded.timestamp;
        }
        console.log("updatedTimestamp");
        console.logUint(updatedTimestamp);
        console.log("updatedFlowRate");
        console.logInt(updatedFlowRate);

        uint256 timeDelta = updatedTimestamp.sub(prevTimestamp);
        uint256 newAccumulatedBalance = savers[from].prevAccumulatedBalance.add(timeDelta.mul(uint256(prevFlowRate)));
        console.log("prevAccumulatedBalance");
        console.logUint(newAccumulatedBalance);

        getBalance(from);

        // Update balance
        savers[from].prevAccumulatedBalance = newAccumulatedBalance;

        // Update other properties
        savers[from].timestamp = updatedTimestamp;
        savers[from].flowRate = updatedFlowRate;
    
    }

    function getBalance(
        address from) 
        private
        returns(uint256 balance) 
    {
        // (int256 balance,,) = _cfa.realtimeBalanceOf(_superToken, from, block.timestamp);
        // (int256 balance,,,) = ISuperToken(_superToken).realtimeBalanceOfNow(from);
        balance = ISuperToken(_superToken).balanceOf(address(this));
        console.log("real time balance");
        console.logUint(balance);

        return balance;
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
        console.log("afterAgreementCreated called");
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
        console.log("afterAgreementUpdated called");
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
        console.log("afterAgreementTerminated called");
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