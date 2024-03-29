import { UnregisterCallback, Omnibus, CallbackType } from '@hypersphere/omnibus';

interface MidiMessage {
    channel: number;
    command: number;
    data1: number;
    data2: number;
}

type MIDIMessage = {
    receivedTime: number;
    data: Uint8Array;
};
type OnMessageCallback = (message: MIDIMessage) => void;
interface IMIDIInput {
    onMessage(callback: OnMessageCallback): Promise<UnregisterCallback>;
    get id(): string;
    get name(): string;
    get manufacturer(): string;
}

interface NoteMessage extends MidiMessage {
    note: number;
    velocity: number;
}
interface ControlChangeMessage extends MidiMessage {
    control: number;
    value: number;
}
interface ProgramChangeMessage extends MidiMessage {
    program: number;
    value: number;
}

type OmnibusKeys<O> = O extends Omnibus<infer K> ? keyof K : never;
type OmnibusParams<O, K extends OmnibusKeys<O>> = O extends Omnibus<infer A> ? A[K] : never;

declare const buildInputBus: () => Omnibus<{
    pithchBend: [{
        channel: number;
        value: number;
    }];
    sysex: [{
        [x: number]: number;
        readonly BYTES_PER_ELEMENT: number;
        readonly buffer: {
            readonly byteLength: number;
            slice: {};
            readonly [Symbol.toStringTag]: string;
        } | {
            readonly byteLength: number;
            slice: {};
            readonly [Symbol.species]: any;
            readonly [Symbol.toStringTag]: "SharedArrayBuffer";
        };
        readonly byteLength: number;
        readonly byteOffset: number;
        copyWithin: {};
        every: {};
        fill: {};
        filter: {};
        find: {};
        findIndex: {};
        forEach: {};
        indexOf: {};
        join: {};
        lastIndexOf: {};
        readonly length: number;
        map: {};
        reduce: {};
        reduceRight: {};
        reverse: {};
        set: {};
        slice: {};
        some: {};
        sort: {};
        subarray: {};
        toLocaleString: {};
        toString: {};
        valueOf: {};
        entries: {};
        keys: {};
        values: {};
        includes: {};
        at: {};
        [Symbol.iterator]: {};
        readonly [Symbol.toStringTag]: "Uint8Array";
    }];
    channelPressure: [{
        channel: number;
        command: number;
        data1: number;
        data2: number;
    }];
    noteOn: [{
        note: number;
        velocity: number;
        channel: number;
        command: number;
        data1: number;
        data2: number;
    }];
    noteOff: [{
        note: number;
        velocity: number;
        channel: number;
        command: number;
        data1: number;
        data2: number;
    }];
    controlChange: [{
        control: number;
        value: number;
        channel: number;
        command: number;
        data1: number;
        data2: number;
    }];
    programChange: [{
        program: number;
        value: number;
        channel: number;
        command: number;
        data1: number;
        data2: number;
    }];
    polyKeyPressure: [{
        channel: number;
        command: number;
        data1: number;
        data2: number;
    }];
    clockPulse: [void];
    clockStart: [void];
    clockStop: [void];
    clockContinue: [void];
    registeredParameterData: [{
        channel: number;
        parameter: "PITCH_BEND_SENSITIVITY" | "CHANNEL_FINE_TUNING" | "CHANNEL_COARSE_TUNING" | "TUNING_PROGRAM_CHANGE" | "TUNING_BANK_SELECT" | "MODULATION_DEPTH_CHANGE" | "MPE_CONFIGURATION_MESSAGE";
        msb: number;
        lsb: number;
    }];
}, "">;
type MIDIValInputBusKeys = OmnibusKeys<ReturnType<typeof buildInputBus>>;
type MIDIValInputBusParams<T extends MIDIValInputBusKeys> = OmnibusParams<ReturnType<typeof buildInputBus>, T>;

type OmnibusKeysCheck<B, T> = T extends OmnibusKeys<B> ? T : never;
type ReverseParameters<T> = T extends [infer K] ? K : T;
interface MIDIValInputOptions {
    computeClockTempo: boolean;
}
declare class MIDIValInput {
    private readonly options;
    private unregisterInput;
    private omnibus;
    private midiInput;
    private tempoSamples;
    private rpn;
    constructor(input: IMIDIInput, options?: MIDIValInputOptions);
    static fromInterfaceId(interfaceId: string, options?: MIDIValInputOptions): Promise<MIDIValInput>;
    static fromInterfaceName(interfaceName: string, options?: MIDIValInputOptions): Promise<MIDIValInput>;
    private static getMidiAccess;
    get tempo(): number;
    once<const B extends typeof this.omnibus, const T extends OmnibusKeys<B>>(event: T): Promise<B extends Omnibus<infer X> ? T extends keyof X ? ReverseParameters<X[T]> : never : never>;
    once<const B extends typeof this.omnibus, const T extends OmnibusKeys<B>, const Cb extends CallbackType<OmnibusParams<B, OmnibusKeysCheck<B, T>>>>(event: T, cb: Cb): UnregisterCallback;
    private registerInput;
    private isClockCommand;
    private onBusKeyValue;
    disconnect(): void;
    onAllNoteOn(callback: CallbackType<[NoteMessage]>): UnregisterCallback;
    onNoteOn(key: number, callback: CallbackType<[NoteMessage]>): UnregisterCallback;
    onAllNoteOff(callback: CallbackType<[NoteMessage]>): UnregisterCallback;
    onNoteOff(key: number, callback: CallbackType<[NoteMessage]>): UnregisterCallback;
    onPitchBend(callback: CallbackType<MIDIValInputBusParams<'pithchBend'>>): UnregisterCallback;
    onAllControlChange(callback: CallbackType<[ControlChangeMessage]>): UnregisterCallback;
    onControlChange(control: number, callback: CallbackType<[MidiMessage]>): UnregisterCallback;
    onAllProgramChange(callback: CallbackType<[ProgramChangeMessage]>): UnregisterCallback;
    onProgramChange(program: number, callback: CallbackType<[ProgramChangeMessage]>): UnregisterCallback;
    onAllPolyKeyPressure(callback: CallbackType<[MidiMessage]>): UnregisterCallback;
    onPolyKeyPressure(key: number, callback: CallbackType<[MidiMessage]>): UnregisterCallback;
    onSysex(callback: CallbackType<[Uint8Array]>): UnregisterCallback;
    onAllSoundsOff(callback: CallbackType<[ControlChangeMessage]>): UnregisterCallback;
    onResetAllControllers(callback: CallbackType<[ControlChangeMessage]>): UnregisterCallback;
    onLocalControlChange(callback: CallbackType<[
        isLocalControlOn: boolean,
        message: ControlChangeMessage
    ]>): UnregisterCallback;
    onAllNotesOff(callback: CallbackType<[MidiMessage]>): UnregisterCallback;
    onChannelPressure(callback: CallbackType<MIDIValInputBusParams<"channelPressure">>): UnregisterCallback;
    onOmniModeOff(callback: CallbackType<[MidiMessage]>): UnregisterCallback;
    onOmniModeOn(callback: CallbackType<[MidiMessage]>): UnregisterCallback;
    onMonoModeOn(callback: CallbackType<[MidiMessage]>): UnregisterCallback;
    onPolyModeOn(callback: CallbackType<[MidiMessage]>): UnregisterCallback;
    onClockPulse(callback: CallbackType<[]>): UnregisterCallback;
    onClockStart(callback: CallbackType<[]>): UnregisterCallback;
    onClockStop(callback: CallbackType<[]>): UnregisterCallback;
    onClockContinue(callback: CallbackType<[]>): UnregisterCallback;
    onMpeConfiguration(callback: CallbackType<MIDIValInputBusParams<"registeredParameterData">>): UnregisterCallback;
    onPitchBendSensitivity(callback: CallbackType<MIDIValInputBusParams<"registeredParameterData">>): UnregisterCallback;
    onChannelFineTuning(callback: CallbackType<MIDIValInputBusParams<"registeredParameterData">>): UnregisterCallback;
    onChannelCoarseTuning(callback: CallbackType<MIDIValInputBusParams<"registeredParameterData">>): UnregisterCallback;
    onTuningProgramChange(callback: CallbackType<MIDIValInputBusParams<"registeredParameterData">>): UnregisterCallback;
    onTuningBankChange(callback: CallbackType<MIDIValInputBusParams<"registeredParameterData">>): UnregisterCallback;
    onModulationDepthChange(callback: CallbackType<MIDIValInputBusParams<"registeredParameterData">>): UnregisterCallback;
}

interface IMIDIOutput {
    send(data: Uint8Array | number[]): void;
    get id(): string;
    get name(): string;
    get manufacturer(): string;
}

declare class MIDIValOutput {
    private midiOutput;
    private defaultChannel;
    constructor(output: IMIDIOutput);
    send(msgs: Uint8Array | number[]): void;
    setChannel(channel: number): void;
    private getChannel;
    static fromInterfaceName(interfaceName: string): Promise<MIDIValOutput>;
    private static getMidiAccess;
    sendNoteOn(note: number, velocity: number, channel?: number): void;
    sendNoteOff(note: number, channel?: number): void;
    sendPolyKeyPressure(key: number, velocity: number, channel?: number): void;
    sendControlChange(controller: number, value: number, channel?: number): void;
    sendProgramChange(program: number, channel?: number): void;
    sendChannelPressure(velocity: number, channel?: number): void;
    sendPitchBend(bendValue: number, channel?: number): void;
    sendAllSoundOff(channel?: number): void;
    sendResetAllControllers(channel?: number): void;
    sendLocalControlOff(channel?: number): void;
    sendLocalControlOn(channel?: number): void;
    sendAllNotesOff(channel?: number): void;
    sendClockStart(): void;
    sendClockStop(): void;
    sendClockContinue(): void;
    sendClockPulse(): void;
    sendRPNSelection([msb, lsb]: readonly [number, number], channel?: number): void;
    sendRPDataMSB(data: number, channel?: number): void;
    sendRPDataLSB(data: number, channel?: number): void;
    incrementRPData(incrementValue: number, channel?: number): void;
    decrementRPData(decrementValue: number, channel?: number): void;
    sendRPNNull(): void;
    initializeMPE(lowerChannelSize: number, upperChannelSize: number, messageDelayMs?: number): Promise<void>;
    setPitchBendSensitivity(semitones: number, cents: number, channel?: number, messageDelayMs?: number): Promise<void>;
}

export { type ControlChangeMessage as C, type IMIDIInput as I, MIDIValInput as M, type NoteMessage as N, type OmnibusParams as O, type ProgramChangeMessage as P, type IMIDIOutput as a, MIDIValOutput as b, type MIDIValInputOptions as c, type MidiMessage as d };
