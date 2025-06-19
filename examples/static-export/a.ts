import { default as pm } from "picomatch";
const isMatch = pm(["a", "**/*.zip"]);
console.log(isMatch("https://vahor.fr/invalid-zip-file.zip"));
