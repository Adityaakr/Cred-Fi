// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AgentWallet
 * @notice Simple wallet contract for Treasury Smart Wallet Agent
 * @dev Can receive usdc, hold funds, and execute basic operations
 */
contract AgentWallet {
    address public owner;
    address public agent;
    uint256 public spendingCap;
    uint256 public creditAllocated;
    uint256 public creditUsed;
    uint256 public reputation;
    uint256 public nonce;
    
    event Deposit(address indexed from, uint256 amount);
    event Withdrawal(address indexed to, uint256 amount);
    event ActionExecuted(address indexed target, uint256 value, bytes data);
    event ReputationUpdated(uint256 oldScore, uint256 newScore);
    event CreditAllocated(uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyAgent() {
        require(msg.sender == agent || msg.sender == owner, "Not authorized");
        _;
    }
    
    constructor(address _owner, uint256 _spendingCap) {
        owner = _owner;
        agent = address(this);
        spendingCap = _spendingCap;
        reputation = 50; // Start at 50/100
        nonce = 0;
    }
    
    /**
     * @notice Receive usdc deposits
     */
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @notice Fallback function
     */
    fallback() external payable {
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @notice Get contract balance
     */
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Withdraw usdc (owner only)
     */
    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(amount);
        emit Withdrawal(owner, amount);
    }
    
    /**
     * @notice Execute action (agent or owner)
     */
    function executeAction(
        address target,
        uint256 value,
        bytes memory data
    ) external onlyAgent returns (bytes memory) {
        require(creditUsed + value <= spendingCap, "Exceeds spending cap");
        require(value <= address(this).balance, "Insufficient balance");
        
        creditUsed += value;
        nonce++;
        
        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "Action failed");
        
        emit ActionExecuted(target, value, data);
        
        // Increase reputation on successful action
        if (reputation < 100) {
            uint256 oldRep = reputation;
            reputation = reputation + 5 > 100 ? 100 : reputation + 5;
            emit ReputationUpdated(oldRep, reputation);
        }
        
        return result;
    }
    
    /**
     * @notice Allocate credit to agent
     */
    function allocateCredit(uint256 amount) external onlyOwner {
        creditAllocated += amount;
        emit CreditAllocated(amount);
    }
    
    /**
     * @notice Update reputation (owner only)
     */
    function updateReputation(uint256 newScore) external onlyOwner {
        require(newScore <= 100, "Score must be <= 100");
        uint256 oldScore = reputation;
        reputation = newScore;
        emit ReputationUpdated(oldScore, newScore);
    }
    
    /**
     * @notice Update spending cap (owner only)
     */
    function updateSpendingCap(uint256 newCap) external onlyOwner {
        spendingCap = newCap;
    }
    
    /**
     * @notice Get agent stats
     */
    function getStats() external view returns (
        uint256 balance,
        uint256 _creditAllocated,
        uint256 _creditUsed,
        uint256 _spendingCap,
        uint256 _reputation,
        uint256 _nonce
    ) {
        return (
            address(this).balance,
            creditAllocated,
            creditUsed,
            spendingCap,
            reputation,
            nonce
        );
    }
}
