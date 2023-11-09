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
    Bool
  } from 'o1js';

await isReady;
let initialBalance = 10_000_000_000;
class ClaimAccountMerkleWitness extends MerkleWitness(8) {}
const claimAccountTree = new MerkleTree(8);



class Account extends CircuitValue {
    @prop username: CircuitString;
    @prop password: Field;
    @prop claimed: Bool;
  
    constructor(username: CircuitString, password: CircuitString, claimed: Bool) {
      super(username, password, claimed);
      this.username = username;
      this.password = Poseidon.hash(password.toFields());
      this.claimed = claimed;
    }
  
    hash(): Field {
      return Poseidon.hash(this.toFields());
    }
  
    setClaimed(claimed: Bool) {
      this.claimed = claimed;
    }
  }

export class ClaimAccountV2 extends SmartContract {
    @state(Field) commitment = State<Field>();

    // deploy(args: DeployArgs) {
    //   super.deploy(args);
    //   this.setPermissions({
    //     ...Permissions.default(),
    //     editState: Permissions.proofOrSignature(),
    //   });
    //   this.balance.addInPlace(UInt64.from(initialBalance));
    //   this.commitment.set(initialClaimTreeCommittment);
    // }

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
    }
  
    createClaimAccountMerkleTree(){
      let committment: Field = Field(0);
      let username = "alysia";
      let account = new Account(CircuitString.fromString(username),CircuitString.fromString("minarocks"), Bool(false));
    
      claimAccountTree.setLeaf(BigInt(0), account.hash());
    
      // now that we got our accounts set up, we need the commitment to deploy our contract!
      committment = claimAccountTree.getRoot();
      
      return committment;
    }
  
  }