import '/styles/globals.css'
import { useEffect, useState } from "react";
import './reactCOIServiceWorker';
import { Container, Row, Col, Button, Card, Form, Spinner, InputGroup, ListGroup, Alert } from 'react-bootstrap'
// import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/css/bootstrap.css';

import ConfettiExplosion from 'react-confetti-explosion';

import ZkappWorkerClient from './zkappWorkerClient';

import {
  PublicKey,
  PrivateKey,
  Field,
} from 'snarkyjs'

import {questionsRadio as questionsRadio} from "../../../quiz-app/src/curriculum/curriculum.js";
import {answers as answers} from "../../../quiz-app/src/curriculum/curriculum.js";
let index = 0;


let transactionFee = 0.1;
export default function App() {

  let [state, setState] = useState({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    hasBeenSetup: false,
    accountExists: false,
    currentNum: null as null | Field,
    publicKey: null as null | PublicKey,
    zkappPublicKey: null as null | PublicKey,
    creatingTransaction: false,
    claimRewardsDisabled: true,
  });

  // -------------------------------------------------------
  // Do Setup

  useEffect(() => {
    (async () => {
      if (!state.hasBeenSetup) {
        const zkappWorkerClient = new ZkappWorkerClient();
        
        console.log('Loading SnarkyJS...');
        await zkappWorkerClient.loadSnarkyJS();
        console.log('done');

        await zkappWorkerClient.setActiveInstanceToBerkeley();

        const mina = (window as any).mina;

        if (mina == null) {
          setState({ ...state, hasWallet: false });
          return;
        }

        const publicKeyBase58 : string = (await mina.requestAccounts())[0];
        const publicKey = PublicKey.fromBase58(publicKeyBase58);

        console.log('using key', publicKey.toBase58());

        console.log('checking if account exists...');
        const res = await zkappWorkerClient.fetchAccount({ publicKey: publicKey! });
        const accountExists = res.error == null;

        await zkappWorkerClient.loadContract();

        console.log('compiling zkApp');
        await zkappWorkerClient.compileContract();
        console.log('zkApp compiled');

        // const zkappPublicKey = PublicKey.fromBase58('B62qph2VodgSo5NKn9gZta5BHNxppgZMDUihf1g7mXreL4uPJFXDGDA');
        const zkappPublicKey = PublicKey.fromBase58('B62qkFzjHYDXq5qnFL7Q3Z63H94vUVPprA6HVULkW8rGtowLDeRusEz');


        await zkappWorkerClient.initZkappInstance(zkappPublicKey);

        console.log('getting zkApp state...');
        await zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey })
        const currentNum = await zkappWorkerClient.getNum();
        console.log('current state:', currentNum.toString());

        setState({ 
            ...state, 
            zkappWorkerClient, 
            hasWallet: true,
            hasBeenSetup: true, 
            publicKey, 
            zkappPublicKey, 
            accountExists, 
            currentNum
        });
      }
    })();
  }, []);

  // -------------------------------------------------------
  // Wait for account to exist, if it didn't

  useEffect(() => {
    (async () => {
      if (state.hasBeenSetup && !state.accountExists) {
        for (;;) {
          console.log('checking if account exists...');
          const res = await state.zkappWorkerClient!.fetchAccount({ publicKey: state.publicKey! })
          const accountExists = res.error == null;
          if (accountExists) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        setState({ ...state, accountExists: true });
      }
    })();
  }, [state.hasBeenSetup]);

  // -------------------------------------------------------
  // Send a transaction

  const onSendTransaction = async (response:number, questionPosition:number) => {
    try{
      setState({ ...state, creatingTransaction: true });
      setLoadTxnClass('d-block');
      console.log('sending a transaction...');

      await state.zkappWorkerClient!.fetchAccount({ publicKey: state.publicKey! });

      let txCreated = await state.zkappWorkerClient!.createUpdateTransaction(response, questionPosition);
      if(txCreated){
        console.log('creating proof...');
        await state.zkappWorkerClient!.proveUpdateTransaction();

        console.log('getting Transaction JSON...');
        const transactionJSON = await state.zkappWorkerClient!.getTransactionJSON()
        console.log(transactionJSON);
        console.log('requesting send transaction...');
        const { hash } = await (window as any).mina.sendTransaction({
          transaction: transactionJSON,
          feePayer: {
            fee: transactionFee,
            memo: '',
          },
        });

        console.log(
          'See transaction at https://berkeley.minaexplorer.com/transaction/' + hash
        );
        txns.push('https://berkeley.minaexplorer.com/transaction/' + hash);
        setState({ ...state, creatingTransaction: false });
        setLoadTxnClass('d-none');
        setClaimViewClass('d-none');

        return true;

      }else{
        setState({ ...state, creatingTransaction: false });
        setLoadTxnClass('d-none');
        setClaimViewClass('d-none');

        return false;
      }
      
      
    }catch(e){
      setState({ ...state, creatingTransaction: false });
      setClaimViewClass('d-none');
      setLoadTxnClass('d-none');

      console.log("error caught")
      console.log(e)
      return false
    }

    
  }

  // -------------------------------------------------------
  // Send a transaction - Claim Rewards

  const onClaimRewardsTransaction = async (publicKeyBase58:string) => {
    try{

      setShowConfetti(false);

      console.log('sending a transaction...');
      setState({ ...state, creatingTransaction: true });
      setLoadTxnClass('d-block');

      // let tokenBalance = await state.zkappWorkerClient!.getTokenBalance(publicKeyBase58);
      // console.log("tokenBalance");
      // console.log(tokenBalance);
      // if(tokenBalance==-1){
      //   console.log('You need to do a tokendeploy to that address first');
      // }
      // await state.zkappWorkerClient!.fetchAccount({ publicKey: state.publicKey! });
      let txCreated = await state.zkappWorkerClient!.createClaimRewardsTransaction(publicKeyBase58);

      if(txCreated){
        console.log('creating proof...');
        await state.zkappWorkerClient!.proveUpdateTransaction();

        console.log('getting Transaction JSON...');
        const transactionJSON = await state.zkappWorkerClient!.getTransactionJSON()
        console.log(transactionJSON);
        console.log('requesting send transaction...');
        const { hash } = await (window as any).mina.sendTransaction({
          transaction: transactionJSON,
          feePayer: {
            fee: transactionFee,
            memo: '',
          },
        });

        console.log(
          'See transaction at https://berkeley.minaexplorer.com/transaction/' + hash
        );
        txns.push('https://berkeley.minaexplorer.com/transaction/' + hash);
        setState({ ...state, creatingTransaction: false });
        setLoadTxnClass('d-none');
        setClaimViewClass('d-none');

        return true;

      }else{
        setState({ ...state, creatingTransaction: false });
        setLoadTxnClass('d-none');

      }
      
      
    }catch(e){
      setState({ ...state, creatingTransaction: false });
      setLoadTxnClass('d-none');

      console.log("error caught")
      console.log(e)
      alert(`This error occurred when trying to create the transaction: ${e.message}`)
      return false
    }
    
    alert("An error occurred when trying to create the transcaction");
    return false;

  }

  
  // -------------------------------------------------------
  // Refresh the current state

  const onRefreshCurrentNum = async () => {
    console.log('getting zkApp state...');
    await state.zkappWorkerClient!.fetchAccount({ publicKey: state.zkappPublicKey! })
    const currentNum = await state.zkappWorkerClient!.getNum();
    console.log('current state:', currentNum.toString());

    setState({ ...state, currentNum });
  }
   // -------------------------------------------------------
  // Show the quiz screen

  const onRestartQuiz = async () => {
    setShowConfetti(false);

    setQuizContentClass("d-block");
    setClaimViewClass("d-none");
  }

  // -------------------------------------------------------
  // Other Methods
  const [item, setItem] = useState({ quizOption: "", another: "another", index:0 });

  const { quizOption: questionResponse } = item;
  const [txns, setTxns] = useState<string[]>([]); 
  const [claimViewClass, setClaimViewClass] = useState("d-none");
  const [quizContentClass, setQuizContentClass] = useState("d-block"); 
  const [loadTxnClass, setLoadTxnClass] = useState("d-none"); 
  const [showConfetti, setShowConfetti] = useState(false); 





  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    console.log(e.target.value);

    setItem(prevState => ({
      ...prevState,
      quizOption: e.target.value,
      // index: index+1
    }));
  };

  const  handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {

    e.preventDefault();

    // e.persist();

    // alert(`${questionResponse}`);
    let formID = e.target.id;
    let questionNumber = parseInt(formID.split('-')[1]);
    let response = parseInt(questionResponse)+1;
    console.log(`${response} was the response to ${questionNumber}`);
    let result = false;
    
    try{
      
      result = await onSendTransaction(response,questionNumber);
      console.log(result)
      if (index<answers.length-1 && result) {
        console.log("set item")
        let newIndex = index+1;
        console.log(index,newIndex)
        
        setItem(prevState => ({
          ...prevState,
          index: index+1
        }));
        console.log(index)
        index = index+1
  
      }
      else if(index>=answers.length-1 && result) {
        index = 0;
        setItem(prevState => ({
          ...prevState,
          index: 0
        }));
        setClaimViewClass("d-block");
        setQuizContentClass("d-none");
        setShowConfetti(true);
        //wait 3 seconds so that the confetti can be shown
        await new Promise( resolve => setTimeout(resolve, 3000) )
        setShowConfetti(false);
      }
      else if(result==false){
        alert("Incorrect")

      }
    }catch(e){
      console.log('error encountered')
      console.log(e);
      alert("Incorrect")
    }
    
  };

  // -------------------------------------------------------
  // Create UI elements

  let hasWallet;
  if (state.hasWallet != null && !state.hasWallet) {
    const auroLink = 'https://www.aurowallet.com/';
    const auroLinkElem = <a href={auroLink} target="_blank" rel="noreferrer"> [Link] </a>
    hasWallet = <div> Could not find a wallet. Install Auro wallet here: { auroLinkElem }</div> 
  }

  let setupText = state.hasBeenSetup ? '' : 'Loading App...';

  let setupAnim = state.hasBeenSetup ? '' :
    <Spinner animation="grow" role="status">
      <span className="visually-hidden">Loading...</span>
    </Spinner>

  let loadingSpinner = 
  <Container  className="text-center">
    <Spinner animation="border" role="status" className={`text-center ${loadTxnClass}`}>
      <span className="visually-hidden">Loading...</span>
    </Spinner>
  </Container>

  // let setup = <div> { setupText } { hasWallet }</div>
  let setup = <Container className="text-center"> { setupAnim } { hasWallet }</Container>
  let logoContent = 
  <Container fluid="sm" className="text-center">
    <Row>
      <Col>
      <Card.Img src='./images/ykp-logo.png'   alt="logo"/>
      </Col>
    </Row>
  </Container>
let confettiContent = showConfetti?<Container fluid="sm" className="text-center"><ConfettiExplosion  /></Container>:"";
let claimContent = 
<div className={claimViewClass}>
 
 
  <Container fluid="sm" className="text-center">
    <Row  >
      <Col >
      {/* <div className="d-grid gap-2"> */}
      <br></br>
      <Alert  variant="info">
        Congratulations, YOU WON!
      </Alert>
      <Button  onClick={() => onClaimRewardsTransaction(state.publicKey!.toBase58())} variant="success" size="lg" disabled={state.claimRewardsDisabled || state.creatingTransaction}> Claim Reward </Button>
      {/* <Button  onClick={() => onClaimRewardsTransaction('B62qkFzjHYDXq5qnFL7Q3Z63H94vUVPprA6HVULkW8rGtowLDeRusEz')} variant="success" size="lg" disabled={state.creatingTransaction}> Claim Reward </Button> */}
      <br></br>
      <br></br>
      
      <Button  onClick={onRestartQuiz} variant="light" size="lg"> Restart Quiz </Button>
      
      {/* </div> */}
      </Col>
    </Row>
  </Container>
  </div>

  let accountDoesNotExist;
  if (state.hasBeenSetup && !state.accountExists) {
    const faucetLink = "https://faucet.minaprotocol.com/?address=" + state.publicKey!.toBase58();
    accountDoesNotExist = <Container>
      Account does not exist. Please visit the faucet to fund this account
      <a href={faucetLink} target="_blank" rel="noreferrer"> [Link] </a>
    </Container>
  }

  let mainContent, quizContent, transactionContent;
  if (state.hasBeenSetup && state.accountExists) {
    mainContent = 
    // <div>
    //   <button onClick={() => onSendTransaction(4,0)} /*disabled={state.creatingTransaction}*/> Send Transaction </button>
    //   <div> Current Number in zkApp: { state.currentNum!.toString() } </div>
    //   <button onClick={onRefreshCurrentNum}> Get Latest State </button>
    // </div>
    <Container fluid="sm" className="text-center">
    <Row>
      <Col></Col>
      <Col>
        <Button onClick={() => onSendTransaction(4,0)} /*disabled={state.creatingTransaction}*/> Send Transaction </Button>
        <div> Current Number in zkApp: { state.currentNum!.toString() } </div>
        <Button onClick={onRefreshCurrentNum}> Get Latest State </Button>
      </Col>
      <Col></Col>
    </Row>
    </Container>;

    quizContent = 
      <Container fluid="sm" className={`text-center ${quizContentClass}`} >
        <Row>
          <Col>
            <Form>
            <h3>{questionsRadio[index].question}</h3>
            <InputGroup>
            {/* {['checkbox', 'radio'].map((type) => (
          <div key={`default-${type}`} className="mb-3">
            <InputGroup.Radio
              type="radio"
              id={`default-${type}`}
              label={`default ${type}`}
            />
            <InputGroup.Radio aria-label="Radio button for following text input" />
          </div>
        ))} */}
        </InputGroup>
          </Form>
          <Form id={`form-${index}`} onSubmit={handleSubmit}>
          <Form.Group controlId="quizOption">
            <Form.Check
              value="0"
              type="radio"
              aria-label="radio 1"
              label={questionsRadio[index].options[0]}
              onChange={handleChange}
              checked={questionResponse === "0"}
            />
            <Form.Check
              value="1"
              type="radio"
              aria-label="radio 2"
              label={questionsRadio[index].options[1]}
              onChange={handleChange}
              checked={questionResponse === "1"}
            />

          <Form.Check
              value="2"
              type="radio"
              aria-label="radio 2"
              label={questionsRadio[index].options[2]}
              onChange={handleChange}
              checked={questionResponse === "2"}
            />
            <Form.Check
              value="3"
              type="radio"
              aria-label="radio 2"
              label={questionsRadio[index].options[3]}
              onChange={handleChange}
              checked={questionResponse === "3"}
            />
          </Form.Group>
          <Button variant="primary" type="submit" disabled={state.creatingTransaction?true:false}>
            Submit
          </Button>
        </Form>
          
        
          </Col>
        </Row>
      </Container>;

      transactionContent = 
      
      <Container fluid="sm" className="text-center">
        <br></br>
        <Row>
          <Col>
            <ListGroup>
              {txns.map((type) => (
                <ListGroup.Item key={type} id={`default-${type}`}>
                  <a href={type} target="_blank"  rel="noreferrer">Transaction Sent</a>
                </ListGroup.Item>
            ))}
            </ListGroup>
          </Col>
        </Row>
      </Container>;
  }



  return <div>
   { logoContent }
   { setup }
   { accountDoesNotExist }
   {/* { mainContent } */}
   { quizContent }
   {confettiContent}
   {claimContent}
   {loadingSpinner}

   { transactionContent }
  </div>
}
