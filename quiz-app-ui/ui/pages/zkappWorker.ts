import {
  Mina,
  isReady,
  PublicKey,
  PrivateKey,
  Field,
  fetchAccount,
  MerkleTree,
  UInt32,
  CircuitValue,
  prop,
  Poseidon,
  MerkleWitness,
  Experimental,
  AccountUpdate,
  UInt64,
  TokenId
} from 'o1js'

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import type { YKProof } from '../../../quiz-app/src/YKProof';
// import { MyMerkleWitness } from '../../contracts/src/Classes';
import {answers as answers} from '../../../quiz-app/src/curriculumOld/curriculum'

export class MyMerkleWitness extends MerkleWitness(8) {}


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
function createMerkleTree(){
  let committment: Field = Field(0);

  

  let Answers: Map<number, Answer> = new Map<number, Answer>();
  for(let i in answers){
      let thisAnswer = new Answer(UInt32.from(answers[i].answer));
      Answers.set(parseInt(i), thisAnswer);
      state.answerTree!.setLeaf(BigInt(i), thisAnswer.hash());
  }

  // now that we got our accounts set up, we need the commitment to deploy our contract!
  committment = state.answerTree!.getRoot();
  return committment;
}

const state = {
  zkapp: null as null | YKProof,
  transaction: null as null | Transaction,
  YKProof: null as null | typeof YKProof,
  answerTree: null as null | MerkleTree,
  tokenId: null as null | Field,
  zkappPublicKey: null as null | PublicKey
}

// ---------------------------------------------------------------------------------------

const functions = {
  loadSnarkyJS: async (args: {}) => {
    await isReady;
    const answerTree = new MerkleTree(8);
    state.answerTree = answerTree;
    createMerkleTree();

  },
  setActiveInstanceToBerkeley: async (args: {}) => {
    const Berkeley = Mina.Network(
      'https://proxy.berkeley.minaexplorer.com/graphql'
    );
    Mina.setActiveInstance(Berkeley);
  },
  loadContract: async (args: {}) => {
    const { YKProof } = await import('../../../quiz-app/build/src/YKProof.js');
    state.YKProof = YKProof;
    console.log("compiling...");
    const verificationKey = await state.YKProof!.compile();
    console.log("verification key hash ", verificationKey.verificationKey.hash);
  },
  compileContract: async (args: {}) => {
    console.log("verificationKey");
    const verificationKey = await state.YKProof!.compile();
    console.log(verificationKey.verificationKey.hash);
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  
  initZkappInstance: async (args: { publicKey58: string }) => {
    console.log("initZkappInstance");
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.YKProof!(publicKey);
    state.tokenId = state.zkapp!.tokenId;
    state.zkappPublicKey = publicKey;
  },
  getNum: async (args: {}) => {
    
    const currentNum = await state.zkapp!.commitment.get();
    return JSON.stringify(currentNum.toJSON());
    
  },
  createUpdateTransaction: async (args: {response: number, questionPosition: number}) => {
    try{
      let w = state.answerTree!.getWitness(BigInt(args.questionPosition));
      let witness = new MyMerkleWitness(w);
      const transaction = await Mina.transaction(() => {
          state.zkapp!.validateQuestionResponse(Field(args.response), witness);
        }
      );
      state.transaction = transaction;
      return true;
    }catch(e){ 
      console.log("error from create tx")
      console.log(e)

      return false;
    }
  },
  
  proveUpdateTransaction: async (args: {}) => {
    try{
      await state.transaction!.prove();
      return true;
    }catch(e){
      console.log("error from proof")
      console.log(e)
      return false;
    }
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  },
  createClaimRewardsTransaction: async (args: { publicKeyBase58:string }) => {
    try{
      // const transaction = await Mina.transaction(() => {
      //     state.zkapp!.mint(PublicKey.fromBase58(args.publicKeyBase58));
      //   }
      // );

      let approveSendingCallback = Experimental.Callback.create(
        state.zkapp!,
        'approveSend',
        []
      );
      
      const transaction = await Mina.transaction(() => {
        state.zkapp!.sendTokens(state.zkappPublicKey!, 
          PublicKey.fromBase58(args.publicKeyBase58),
          approveSendingCallback);
      });
      state.transaction = transaction;
      return true;
    }catch(e){ 
      console.log("error from create claim tx")
      console.log(e)
      return false;
    }
  },
  
  getTokenBalance: (args: { publicKeyBase58: string }) => {
    try{
      return Mina.getBalance(PublicKey.fromBase58(args.publicKeyBase58), state.tokenId!).value.toBigInt()
    }catch(e){
      return -1;
    }
    
  }
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number,
  fn: WorkerFunctions,
  args: any
}

export type ZkappWorkerReponse = {
  id: number,
  data: any
}
if (process.browser) {
  addEventListener('message', async (event: MessageEvent<ZkappWorkerRequest>) => {
    const returnData = await functions[event.data.fn](event.data.args);

    const message: ZkappWorkerReponse = {
      id: event.data.id,
      data: returnData,
    }
    postMessage(message)
  });
}
