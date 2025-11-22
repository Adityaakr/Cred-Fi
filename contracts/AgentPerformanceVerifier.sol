// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FlexCreditCore.sol";
import "./AgentPolicy.sol";

/**
 * @title AgentPerformanceVerifier
 * @notice Verifies Vouch/vlayer agent performance proofs and updates risk scores
 * @dev Integrates with vlayer's Web Proof verification system for AI agent performance
 */
contract AgentPerformanceVerifier {
    // ============ State Variables ============
    
    FlexCreditCore public creditCore;
    AgentPolicy public agentPolicy;
    address public owner;
    
    // Track processed proofs
    mapping(bytes32 => bool) public processedProofs;
    
    // vlayer verifier contract
    address public vlayerVerifier;
    
    // ============ Events ============
    
    event AgentProofSubmitted(
        address indexed user,
        bytes32 indexed agentId,
        int256 pnlBucket,
        bytes32 proofHash,
        uint256 timestamp
    );
    
    event AgentProofVerified(
        address indexed user,
        bytes32 indexed agentId,
        int256 pnlBucket,
        uint256 newDailyLimit
    );
    
    // ============ Constructor ============
    
    constructor(address _creditCore, address _agentPolicy) {
        creditCore = FlexCreditCore(_creditCore);
        agentPolicy = AgentPolicy(_agentPolicy);
        owner = msg.sender;
    }
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    // ============ Admin Functions ============
    
    function setVlayerVerifier(address _verifier) external onlyOwner {
        vlayerVerifier = _verifier;
    }
    
    // ============ Core Verification Functions ============
    
    /**
     * @notice Submit and verify agent performance proof from Vouch
     * @param proof The full proof data from vlayer
     * @param publicInputs Public inputs: (user, agentId, pnlBucket, timestamp)
     */
    function submitAgentProof(
        bytes calldata proof,
        bytes calldata publicInputs
    ) external {
        // Decode public inputs
        (address userFromProof, bytes32 agentId, int256 pnlBucket, uint256 timestamp) = 
            abi.decode(publicInputs, (address, bytes32, int256, uint256));
        
        // Verify the user matches the caller
        require(userFromProof == msg.sender, "User mismatch");
        
        // Verify PnL bucket is valid: -1 (loss), 0 (neutral), +1 (profit)
        require(
            pnlBucket == -1 || pnlBucket == 0 || pnlBucket == 1,
            "Invalid PnL bucket"
        );
        
        // Create proof hash to prevent replay
        bytes32 proofHash = keccak256(abi.encodePacked(proof, publicInputs));
        require(!processedProofs[proofHash], "Proof already processed");
        
        // Verify timestamp is recent (within 1 hour)
        require(block.timestamp - timestamp < 3600, "Proof too old");
        
        // HACKATHON SIMPLIFICATION:
        // In production: IVlayerVerifier(vlayerVerifier).verify(proof, publicInputs)
        require(proof.length > 0, "Empty proof");
        require(publicInputs.length > 0, "Empty public inputs");
        
        // Mark proof as processed
        processedProofs[proofHash] = true;
        
        emit AgentProofSubmitted(userFromProof, agentId, pnlBucket, proofHash, timestamp);
        
        // Apply agent performance to credit core
        creditCore.applyAgentPerformance(userFromProof, agentId, pnlBucket);
        
        // Upgrade agent tier based on risk score
        agentPolicy.upgradeAgentTier(userFromProof, agentId, pnlBucket);
        
        // Get new daily limit for event
        (uint256 newDailyLimit,,) = agentPolicy.getPolicy(userFromProof, agentId);
        
        emit AgentProofVerified(userFromProof, agentId, pnlBucket, newDailyLimit);
    }
    
    /**
     * @notice Simplified verification for testing
     */
    function submitAgentProofSimplified(
        address user,
        bytes32 agentId,
        int256 pnlBucket,
        bytes32 proofHash
    ) external {
        require(msg.sender == user, "Only user can submit");
        require(!processedProofs[proofHash], "Proof already processed");
        
        processedProofs[proofHash] = true;
        
        emit AgentProofSubmitted(user, agentId, pnlBucket, proofHash, block.timestamp);
        
        creditCore.applyAgentPerformance(user, agentId, pnlBucket);
        agentPolicy.upgradeAgentTier(user, agentId, pnlBucket);
        
        (uint256 newDailyLimit,,) = agentPolicy.getPolicy(user, agentId);
        
        emit AgentProofVerified(user, agentId, pnlBucket, newDailyLimit);
    }
    
    // ============ View Functions ============
    
    function isProofProcessed(bytes32 proofHash) external view returns (bool) {
        return processedProofs[proofHash];
    }
}
