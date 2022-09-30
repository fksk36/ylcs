import readComments from './read-comments.mjs';
import toJson from './to-json.mjs';

const args = process.argv.slice(2);
const url = args[0];

readComments(url)
    .pipe(toJson)
    .subscribe(console.log);