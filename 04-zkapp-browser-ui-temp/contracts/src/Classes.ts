// this map serves as our off-chain in-memory storage
import {
    Field,
    CircuitValue,
    CircuitString,
    prop,
    Poseidon,
    MerkleWitness,
    UInt32,
    MerkleTree
  } from 'snarkyjs';

import {questions as questions} from "../curriculum/curriculum.js"
import {answers as answers} from "../curriculum/curriculum.js"

export class Account extends CircuitValue {
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

export class Answer extends CircuitValue {
    @prop answer: UInt32;
  
    constructor(answer: UInt32) {
      super(answer);
      this.answer = answer;
    }
  
    hash(): Field {
      return Poseidon.hash(this.toFields());
    }
  }

export class ClaimAccountMerkleWitness extends MerkleWitness(8) {}
export class MyMerkleWitness extends MerkleWitness(8) {}

export function createAnswerMerkleTree(){
    let committment: Field = Field(0);
    let Answers: Map<number, Answer> = new Map<number, Answer>();
    const answerTree = new MerkleTree(8);

    for(let i in answers){
        let thisAnswer = new Answer(UInt32.from(answers[i].answer));
        Answers.set(parseInt(i), thisAnswer);
        answerTree.setLeaf(BigInt(i), thisAnswer.hash());
        console.log(i, thisAnswer);
    }
  
    // now that we got our accounts set up, we need the commitment to deploy our contract!
    return answerTree;
}