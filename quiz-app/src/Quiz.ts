import {
    Field,
    SmartContract,
    state,
    State,
    method,
    DeployArgs,
    Permissions,
    isReady,
    Poseidon,
    Experimental,
    UInt32,
    CircuitValue,
    prop,
  } from 'snarkyjs';
    import {short as introQuestions} from "./curriculum/curriculum.js"

  await isReady;
    class MerkleWitness extends Experimental.MerkleWitness(8) {}

  // we need the initiate tree root in order to tell the contract about our off-chain storage
    let initialCommitment: Field = Field(0);
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

    const answerTree = new Experimental.MerkleTree(8);
    let Answers: Map<number, Answer> = new Map<number, Answer>();
    function createMerkleTree(){
        let committment: Field = Field(0);

        let Answers: Map<number, Answer> = new Map<number, Answer>();
        for(let i in introQuestions){
            let thisAnswer = new Answer(UInt32.fromNumber(introQuestions[i].answer));
            Answers.set(parseInt(i), thisAnswer);
            answerTree.setLeaf(BigInt(i), thisAnswer.hash());
        }

        // now that we got our accounts set up, we need the commitment to deploy our contract!
        committment = answerTree.getRoot();
        return committment;
    }
  
  export class Quiz extends SmartContract {
    @state(Field) highestScore = State<Field>();
    @state(Field) totalQuestions = State<Field>();
    // a commitment is a cryptographic primitive that allows us to commit to data, with the ability to "reveal" it later
    @state(Field) commitment = State<Field>();
  
    deploy(args: DeployArgs) {
      super.deploy(args);
      this.setPermissions({
        ...Permissions.default(),
        editState: Permissions.proofOrSignature(),
      });
      initialCommitment = createMerkleTree();
      this.commitment.set(initialCommitment);
    }
  
    @method init() {
      this.highestScore.set(Field(0));
      this.totalQuestions.set(Field(5));
    }

    @method validateQuestionResponse(response: Field, path: MerkleWitness){
        //check if response hashes to the correctAnswer hash
        // Poseidon.hash([response]).assertEquals(correctAnswer);

        // we fetch the on-chain commitment
        let commitment = this.commitment.get();
        this.commitment.assertEquals(commitment);
    
        // we check that the response is the same as the hash of the answer at that path
        path.calculateRoot(Poseidon.hash([response])).assertEquals(commitment);

    
    }

    // guessPreimage(guess: Field, account: Account, path: MerkleWitness) {
    //     // this is our hash! its the hash of the preimage "22", but keep it a secret!
    //     let target = Field(
    //       '17057234437185175411792943285768571642343179330449434169483610110583519635705'
    //     );
    //     // if our guess preimage hashes to our target, we won a point!
    //     Poseidon.hash([guess]).assertEquals(target);
    
    //     // we fetch the on-chain commitment
    //     let commitment = this.commitment.get();
    //     this.commitment.assertEquals(commitment);
    
    //     // we check that the account is within the committed Merkle Tree
    //     path.calculateRoot(account.hash()).assertEquals(commitment);
    
    //     // we update the account and grant one point!
    //     let newAccount = account.addPoints(1);
    
    //     // we calculate the new Merkle Root, based on the account changes
    //     let newCommitment = path.calculateRoot(newAccount.hash());
    
    //     this.commitment.set(newCommitment);
    //   }

    @method updateHighestScore(score: Field){
        const currentHighScore = this.highestScore.get();
        this.highestScore.assertEquals(currentHighScore);
        currentHighScore.assertLt(score); //generate proof to make sure that the score is higher than the last highscore]
        this.highestScore.set(score);
    }


    @method submitCompletion(correctAnswers: Field){
        const totalQuestions = this.totalQuestions.get();
        this.totalQuestions.assertEquals(totalQuestions);
        this.totalQuestions.assertEquals(correctAnswers); //generate proof to make sure that the correctAnswers is the same as totalQuestions
        //TODO: save the users public key
    }
  
  }
  