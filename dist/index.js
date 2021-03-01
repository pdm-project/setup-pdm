"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const setupPython = __importStar(require("setup-python/dist"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const INSTALL_VERSION = "3.8";
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const arch = core.getInput("architecture") || os.arch();
        const pdmVersion = core.getInput("version");
        const pdmPackage = pdmVersion ? `pdm==${pdmVersion}` : "pdm";
        try {
            yield setupPython.findPythonVersion(INSTALL_VERSION, arch);
            yield exec.exec("python", ["-m", "pip", "install", "-U", pdmPackage]);
            const installed = yield setupPython.findPythonVersion(core.getInput("python-version"), arch);
            yield exec.exec("pdm", ["use", "-f", installed.version]);
            const pdmVersionOutput = (yield child_process_1.exec("pdm --version")).stdout;
            core.info(`Successfully setup ${pdmVersionOutput} with Python ${installed.version}`);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
