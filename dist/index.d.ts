import { I as IMIDIInput, a as IMIDIOutput, M as MIDIValInput, b as MIDIValOutput } from './MIDIValOutput-CsrbvXBA.js';
export { C as ControlChangeMessage, c as MIDIValInputOptions, d as MidiMessage, N as NoteMessage, P as ProgramChangeMessage } from './MIDIValOutput-CsrbvXBA.js';
import { UnregisterCallback, CallbackType } from '@hypersphere/omnibus';
export { CallbackType as Callback, UnregisterCallback } from '@hypersphere/omnibus';

type InputStateChangeCallback = CallbackType<[IMIDIInput]>;
type OutputStateChangeCallback = CallbackType<[IMIDIOutput]>;
interface IMIDIAccess {
    connect(): Promise<void>;
    get inputs(): IMIDIInput[];
    get outputs(): IMIDIOutput[];
    onInputConnected(callback: InputStateChangeCallback): UnregisterCallback;
    onInputDisconnected(callback: InputStateChangeCallback): UnregisterCallback;
    onOutputConnected(callback: OutputStateChangeCallback): UnregisterCallback;
    onOutputDisconnected(callback: OutputStateChangeCallback): UnregisterCallback;
}

interface ConfigScheme {
    name?: string | RegExp;
    manufacturer?: string | RegExp;
}
declare class MIDIVal {
    private static isSetupComplete;
    private static accessObject;
    static configureAccessObject(newAccess: IMIDIAccess): void;
    static onInputDeviceConnected(callback: CallbackType<[IMIDIInput]>, callOnAlreadyConnected?: boolean): Promise<UnregisterCallback>;
    static onInputDeviceWithConfigConnected(config: ConfigScheme, fn: (input: MIDIValInput) => void, callOnAlreadyConnected?: boolean): Promise<UnregisterCallback>;
    static onOutputDeviceWithConfigConnected(config: ConfigScheme, fn: (output: MIDIValOutput) => void, callOnAlreadyConnected?: boolean): Promise<UnregisterCallback>;
    static onOutputDeviceConnected(callback: CallbackType<[IMIDIOutput]>, callOnAlreadyConnected?: boolean): Promise<UnregisterCallback>;
    static onInputDeviceDisconnected(callback: CallbackType<[IMIDIInput]>): Promise<UnregisterCallback>;
    static onOutputDeviceDisconnected(callback: CallbackType<[IMIDIOutput]>): Promise<UnregisterCallback>;
    static fromMIDIInput(input: IMIDIInput): MIDIValInput;
    static fromMIDIOutput(output: IMIDIOutput): MIDIValOutput;
    static connect(): Promise<IMIDIAccess>;
    private static setupDeviceWatchers;
}

export { type IMIDIAccess, IMIDIInput, IMIDIOutput, MIDIVal, MIDIValInput, MIDIValOutput };
