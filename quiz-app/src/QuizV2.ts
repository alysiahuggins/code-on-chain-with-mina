import {
    Field,
    SmartContract,
    state,
    State,
    method,
    DeployArgs,
    Permissions,
    Poseidon,
    UInt64,
    MerkleWitness,
    CircuitValue,
    prop,
    UInt32,
    MerkleTree,
    isReady
  } from 'snarkyjs';
import {answers as answers} from "./curriculum/curriculum.js"

await isReady;
let initialBalance = 10_000_000_000;

class MyMerkleWitness extends MerkleWitness(8) {}
const answerTree = new MerkleTree(8);
    
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

export class QuizV2 extends SmartContract {
  @state(Field) highestScore = State<Field>();
  @state(Field) totalQuestions = State<Field>();
  // a commitment is a cryptographic primitive that allows us to commit to data, with the ability to "reveal" it later
  @state(Field) commitment = State<Field>();

  // deploy(args: DeployArgs) {
  // super.deploy(args);
  // // this.setPermissions({
  // //   ...Permissions.default(),
  // //   editState: Permissions.proofOrSignature(),
  // // });
  // // this.totalQuestions.set(Field(5));
  // // this.balance.addInPlace(UInt64.from(initialBalance));

  // // this.commitment.set(this.createMerkleTree());
  // }

  // @method setCommittment(committment: Field) {
  //   this.commitment.set(committment);
    
  // }

  // @method init(zkappKey: PrivateKey) {
  //   super.init(zkappKey);
  //   this.highestScore.set(Field(0));
  //   this.totalQuestions.set(Field(5));
  //   this.totalQuestions.set(Field(1));
  // }

  init(){
    super.init();
    this.commitment.set(this.createMerkleTree());
    this.balance.addInPlace(UInt64.from(initialBalance));

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
    
    let commitment = this.commitment.get();
    this.commitment.assertEquals(commitment);

    // we check that the response is the same as the hash of the answer at that path
    path.calculateRoot(Poseidon.hash(response.toFields())).assertEquals(commitment);
  }

}