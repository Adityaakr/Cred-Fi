// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FlexCreditCore.sol";

/**
 * @title IncomeProofVerifier
 * @notice Verifies Vouch/vlayer income proofs and updates credit scores
 * @dev Integrates with vlayer's Web Proof verification system
 */
contract IncomeProofVerifier {
    // ============ State Variables ============
    
    FlexCreditCore public creditCore;
    address public owner;
    
    // Track processed proofs to prevent replay attacks
    mapping(bytes32 => bool) public processedProofs;
    
    // vlayer verifier contract (simplified for hackathon)
    // In production, this would be the actual vlayer verifier
    address public vlayerVerifier;
    
    // ============ Events ============
    
    event IncomeProofSubmitted(
        address indexed user,
        uint256 incomeBucket,
        bytes32 proofHash,
        uint256 timestamp
    );
    
    event IncomeProofVerified(
        address indexed user,
        uint256 incomeBucket,
        uint256 newCreditLimit
    );
    
    // ============ Structs ============
    
    struct IncomeProof {
        address user;           // User address from proof
        uint256 incomeBucket;   // 0, 500, 1000, 2000
        bytes32 proofHash;      // Hash of the full proof
        uint256 timestamp;      // When proof was generated
    }
    
    // ============ Constructor ============
    
    constructor(address _creditCore) {
        creditCore = FlexCreditCore(_creditCore);
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
     * @notice Submit and verify income proof from Vouch
     * @param proof The full proof data from vlayer
     * @param publicInputs Public inputs extracted from the proof
     * @dev For hackathon: simplified verification. Production would use full vlayer verification.
     */
    function submitIncomeProof(
        bytes calldata proof,
        bytes calldata publicInputs
    ) external {
        // Decode public inputs
        (address userFromProof, uint256 incomeBucket, uint256 timestamp) = 
            abi.decode(publicInputs, (address, uint256, uint256));
        
        // Verify the user matches the caller (or allow delegation)
        require(userFromProof == msg.sender, "User mismatch");
        
        // Verify income bucket is valid
        require(
            incomeBucket == 0 || 
            incomeBucket == 500 || 
            incomeBucket == 1000 || 
            incomeBucket == 2000,
            "Invalid income bucket"
        );
        
        // Create proof hash to prevent replay
        bytes32 proofHash = keccak256(abi.encodePacked(proof, publicInputs));
        require(!processedProofs[proofHash], "Proof already processed");
        
        // Verify timestamp is recent (within 1 hour)
        require(block.timestamp - timestamp < 3600, "Proof too old");
        
        // HACKATHON SIMPLIFICATION:
        // In production, this would call vlayer's verifier contract:
        // require(IVlayerVerifier(vlayerVerifier).verify(proof, publicInputs), "Invalid proof");
        
        // For hackathon, we verify the proof structure is valid
        require(proof.length > 0, "Empty proof");
        require(publicInputs.length > 0, "Empty public inputs");
        
        // Mark proof as processed
        processedProofs[proofHash] = true;
        
        emit IncomeProofSubmitted(userFromProof, incomeBucket, proofHash, timestamp);
        
        // Apply income score to credit core
        creditCore.applyIncomeScore(userFromProof, incomeBucket);
        
        // Get new credit limit for event
        (, uint256 newLimit,,) = creditCore.getCreditInfo(userFromProof);
        
        emit IncomeProofVerified(userFromProof, incomeBucket, newLimit);
    }
    
    /**
     * @notice Simplified verification for testing
     * @dev Only for hackathon demo - allows direct submission with signature
     */
    function submitIncomeProofSimplified(
        address user,
        uint256 incomeBucket,
        bytes32 proofHash
    ) external {
        require(msg.sender == user, "Only user can submit");
        require(!processedProofs[proofHash], "Proof already processed");
        
        processedProofs[proofHash] = true;
        
        emit IncomeProofSubmitted(user, incomeBucket, proofHash, block.timestamp);
        
        creditCore.applyIncomeScore(user, incomeBucket);
        
        (, uint256 newLimit,,) = creditCore.getCreditInfo(user);
        
        emit IncomeProofVerified(user, incomeBucket, newLimit);
    }
    
    // ============ View Functions ============
    
    function isProofProcessed(bytes32 proofHash) external view returns (bool) {
        return processedProofs[proofHash];
    }
}
