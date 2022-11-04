//https://stackoverflow.com/a/70668644
import {createInterface} from "readline";

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});


const question = (question: string) => {
    return new Promise<string>((resolve, reject) => {
        rl.question(question, (answer) => {
        resolve(answer)
        })
    })
    }
export default question;