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

import {
    ILendingPool
} from "../interfaces/ILendingPool.sol";

import {
    ILendingPoolAddressesProvider
} from "../interfaces/ILendingPoolAddressesProvider.sol";

import {
    IERC20
} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
    ILendingPoolAddressesProvider private _aaveLendingPoolProvider;

    constructor(
        ISuperfluid host,
        IConstantFlowAgreementV1 cfa,
        ISuperToken superToken,
        ILendingPoolAddressesProvider aaveLendingPoolProvider
    ) 
    {
        require(address(host) != address(0), "Auction: host is empty");
        require(address(cfa) != address(0), "Auction: cfa is empty");
        require(address(superToken) != address(0), "Auction: superToken is empty");
        require(address(aaveLendingPoolProvider) != address(0), "Auction: aaveLendingPoolProvider is empty");
        _host = host;
        _cfa = cfa;
        _superToken = superToken;
        _aaveLendingPoolProvider = aaveLendingPoolProvider;

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

        // _getBalance(from);

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

        uint256 newAccumulatedBalance = _getBalance(from, updatedTimestamp);

        console.log("prevAccumulatedBalance");
        console.logUint(newAccumulatedBalance);

        // Update balance
        savers[from].prevAccumulatedBalance = newAccumulatedBalance;

        // Update other properties
        savers[from].timestamp = updatedTimestamp;
        savers[from].flowRate = updatedFlowRate;
    }

    function _depositBalance() 
        public 
    {
        // Check point timestamp
        // IF amount > -1
            // Check if balance is sufficient
            // Update Saver object (balance = currBalance - amount, updatedTime = now)
            // Downgrade amount
            // Deposit into AAVE
        // IF amount == -1
            // Update Saver object (balance = 0, updatedTime = now)
            // Downgrade amount
            // Deposit into AAVE

        uint256 checkpoint = block.timestamp;
        console.log("msg.sender: ");
        console.log(msg.sender);
        uint256 balanceAtCheckpoint = _getBalance(msg.sender, checkpoint);
        console.log("balanceAtCheckpoint: ");
        console.logUint(balanceAtCheckpoint);

        uint256 amountToDeposit = balanceAtCheckpoint;

        int amount = -1;
        console.log("amount: ");
        console.logInt(amount);

        ILendingPoolAddressesProvider provider = ILendingPoolAddressesProvider(_aaveLendingPoolProvider);
        ILendingPool lendingPool = ILendingPool(provider.getLendingPool());

        // if (amount > -1) {
        //     savers[msg.sender].timestamp = checkpoint;
        //     savers[msg.sender].prevAccumulatedBalance = balanceAtCheckpoint.sub(uint256(amount));
        //     amountToDeposit = uint256(amount);
        // }
        // else {
        //     savers[msg.sender].timestamp = checkpoint;
        //     savers[msg.sender].prevAccumulatedBalance = 0;
        // }

        console.log("_superToken symbol: " );
        console.log(ISuperToken(_superToken).name());

        address underlyingToken = ISuperToken(_superToken).getUnderlyingToken();

        console.log("underlyingToken: ");
        console.logAddress(underlyingToken);

        ISuperToken(_superToken).downgrade(amountToDeposit);

        console.log("amountToDeposit: ");
        console.logUint(amountToDeposit);

        uint256 underlyingTokenBalance = IERC20(underlyingToken).balanceOf(address(this));

        console.log("underlyingToken balance: ");
        console.logUint(underlyingTokenBalance);

        IERC20(underlyingToken).approve(provider.getLendingPool(), amountToDeposit);

        lendingPool.deposit(underlyingToken, amountToDeposit, msg.sender, 0);

        savers[msg.sender].timestamp = checkpoint;
        savers[msg.sender].prevAccumulatedBalance = 0;
    }

    function _getBalance(
        address from,
        uint256 timestamp)
        private
        view
        returns(uint256 balance)
    {     
        int96 prevFlowRate = savers[from].flowRate;
        uint256 prevTimestamp = savers[from].timestamp;
        uint256 timeDelta = timestamp.sub(prevTimestamp);
        uint256 newAccumulatedBalance = savers[from].prevAccumulatedBalance.add(timeDelta.mul(uint256(prevFlowRate)));

        return newAccumulatedBalance;
    }

    // function _getBalance(
    //     address from) 
    //     private
    //     returns(uint256 balance) 
    // {
    //     // (int256 balance,,) = _cfa.realtimeBalanceOf(_superToken, from, block.timestamp);
    //     // (int256 balance,,,) = ISuperToken(_superToken).realtimeBalanceOfNow(from);
    //     balance = ISuperToken(_superToken).balanceOf(address(this));
    //     console.log("real time balance");
    //     console.logUint(balance);

    //     return balance;
    // }


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