import {
    Field,
    SmartContract,
    state,
    State,
    method,
    DeployArgs,
    Permissions,
    isReady,
  } from 'snarkyjs';

  import {Square} from './Square.js';
  await isReady;
  // we need the initiate tree root in order to tell the contract about our off-chain storage
    let initialCommitment: Field = Field(0);
  
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
      this.commitment.set(initialCommitment);
    }
  
    @method init() {
      this.highestScore.set(Field(0));
      this.totalQuestions.set(Field(5));
    }

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
  