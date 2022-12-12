/**
 * Consolidation of all Smart Contracts for the purpose of deploying to one address
 * Includes {QuizV2, QuizToken, UserAccount, ClaimAccount}
 */
 import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Poseidon,
  MerkleWitness,
  CircuitValue,
  prop,
  isReady,
  CircuitString,
  UInt64,
  MerkleTree,
  DeployArgs,
  Permissions,
  UInt32,
  PublicKey,
  Experimental,
  PrivateKey,
  AccountUpdate,
  Int64,
  VerificationKey
} from 'snarkyjs';

import {answers10 as answers} from "./curriculum/curriculum.js"

await isReady; //comment this when deploying to berkeley or when running with ui
let initialBalance = 100_000_000_000;

class MyMerkleWitness extends MerkleWitness(8) {}
const answerTree = new MerkleTree(8);
class ClaimAccountMerkleWitness extends MerkleWitness(8) {}
const claimAccountTree = new MerkleTree(8);

class Answer extends CircuitValue {
  @prop answer: UInt32;

  constructor(answer: UInt32) {
    super(answer);
    this.answer = answer;
  }

  hash(): Field {
    return Poseidon.hash(this.toFields());
  }
}


class Account extends CircuitValue {
  @prop username: CircuitString;
  @prop password: Field;
  @prop claimed: Field;

  constructor(username: CircuitString, password: CircuitString, claimed: Field) {
    super(username, password, claimed);
    this.username = username;
    this.password = Poseidon.hash(password.toFields());
    this.claimed = claimed;
  }

  hash(): Field {
    return Poseidon.hash(this.toFields());
  }

  setClaimed(claimed: Field) {
    this.claimed = claimed;
  }
}

export class YKProof extends SmartContract {
  @state(Field) commitment = State<Field>();
  @state(Field) quizAnswerCommittment = State<Field>();


  deploy(args: DeployArgs){
      super.deploy(args);
      this.setPermissions({
              ...Permissions.default(),
              editState: Permissions.proofOrSignature(),
            });
    this.balance.addInPlace(UInt64.from(initialBalance)); //comment this for deployment to berkeley

  }

  
  @method validateAccountPassword(account: Account, path: ClaimAccountMerkleWitness){
    let commitment = this.commitment.get();
    this.commitment.assertEquals(commitment);

    // we check that the response is the same as the hash of the answer at that path
    path.calculateRoot(Poseidon.hash(account.toFields())).assertEquals(commitment);

  }

  @method createAccount(account:Account, path: ClaimAccountMerkleWitness){
    
    let commitment = this.commitment.get();
    this.commitment.assertEquals(commitment);

    // we check that the account is not in the tree
    try{
      path.calculateRoot(Poseidon.hash(account.toFields())).assertEquals(commitment);
    }catch(e){
      //assert failed which is what we expect so now we create the account in the tree
      let newCommitment = path.calculateRoot(account.hash());
      this.commitment.set(newCommitment);
    }

  }

  init(){
    super.init();
  //   this.balance.addInPlace(UInt64.from(initialBalance));
    this.commitment.set(this.createClaimAccountMerkleTree());
    this.quizAnswerCommittment.set(this.createMerkleTree());
  }

  createClaimAccountMerkleTree(){
    let committment: Field = Field(0);
    let username = "alysia";
    let account = new Account(CircuitString.fromString(username),CircuitString.fromString("minarocks"), Field(false));
  
    claimAccountTree.setLeaf(BigInt(0), account.hash());
  
    // now that we got our accounts set up, we need the commitment to deploy our contract!
    committment = claimAccountTree.getRoot();
    
    return committment;
  }

  createMerkleTree(){
      let committment: Field = Field(0);
    
      let Answers: Map<number, Answer> = new Map<number, Answer>();
      for(let i in answers){
          let thisAnswer = new Answer(UInt32.from(answers[i].answer));
          Answers.set(parseInt(i), thisAnswer);
          answerTree.setLeaf(BigInt(i), thisAnswer.hash());
      }
    
      // now that we got our accounts set up, we need the commitment to deploy our contract!
      committment = answerTree.getRoot();
      return committment;
    }

    @method validateQuestionResponse(response: Field, path: MyMerkleWitness){
      
      let quizAnswerCommittment = this.quizAnswerCommittment.get();
      this.quizAnswerCommittment.assertEquals(quizAnswerCommittment);
  
      // we check that the response is the same as the hash of the answer at that path
      path.calculateRoot(Poseidon.hash(response.toFields())).assertEquals(quizAnswerCommittment);
    }


    // QUiz TOken
    @method tokenDeploy(deployer: PrivateKey, verificationKey: VerificationKey) {
      let address = deployer.toPublicKey();
      let tokenId = this.token.id;
      let deployUpdate = Experimental.createChildAccountUpdate(
        this.self,
        address,
        tokenId
      );
      AccountUpdate.setValue(deployUpdate.update.permissions, {
        ...Permissions.default(),
        send: Permissions.proof(),
      });
      AccountUpdate.setValue(
        deployUpdate.update.verificationKey,
        verificationKey
      );
      deployUpdate.sign(deployer);
      
    }
  
    @method mint(receiverAddress: PublicKey) {
      let amount = UInt64.from(1_000_000);
      this.token.mint({ address: receiverAddress, amount });
    }
  
    @method burn(receiverAddress: PublicKey) {
      let amount = UInt64.from(1_000);
      this.token.burn({ address: receiverAddress, amount });
    }
  
    @method sendTokens(
      senderAddress: PublicKey,
      receiverAddress: PublicKey,
      callback: Experimental.Callback<any>
    ) {
      let senderAccountUpdate = this.approve(
        callback,
        AccountUpdate.Layout.AnyChildren
      );
      let amount = UInt64.from(1_000);
      let negativeAmount = Int64.fromObject(
        senderAccountUpdate.body.balanceChange
      );
      negativeAmount.assertEquals(Int64.from(amount).neg());
      let tokenId = this.token.id;
      senderAccountUpdate.body.tokenId.assertEquals(tokenId);
      senderAccountUpdate.body.publicKey.assertEquals(senderAddress);
      let receiverAccountUpdate = Experimental.createChildAccountUpdate(
        this.self,
        receiverAddress,
        tokenId
      );
      receiverAccountUpdate.balance.addInPlace(amount);
    }

    //UserAccount
    @method approveSend() {
      let amount = UInt64.from(1_000);
      this.balance.subInPlace(amount);
    }
}