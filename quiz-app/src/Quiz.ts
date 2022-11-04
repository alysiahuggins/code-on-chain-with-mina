import {
    Field,
    SmartContract,
    state,
    State,
    method,
    DeployArgs,
    Permissions,
  } from 'snarkyjs';

  import {Square} from './Square.js';
  
  export class Quiz extends SmartContract {
    @state(Field) highestScore = State<Field>();
    @state(Field) totalQuestions = State<Field>();
  
    deploy(args: DeployArgs) {
      super.deploy(args);
      this.setPermissions({
        ...Permissions.default(),
        editState: Permissions.proofOrSignature(),
      });
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
  