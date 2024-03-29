import * as _hypersphere_omnibus from '@hypersphere/omnibus';
import { CallbackType } from '@hypersphere/omnibus';
import { M as MIDIValInput, O as OmnibusParams, b as MIDIValOutput, a as IMIDIOutput } from './MIDIValOutput-CsrbvXBA.js';

interface MemberPitchBendMessage {
    masterPitchBend: number;
    memberPitchBend: number;
    channel: number;
}
interface ChannelValueMessage {
    channel: number;
    value: number;
}
interface MemberPressureMessage {
    channel: number;
    masterPressure: number;
    memberPressure: number;
}
interface MemberTimbreMessage {
    channel: number;
    masterTimbre: number;
    memberTimbre: number;
}
declare class MPEInputZone {
    #private;
    masterChannel: number;
    readonly memberChannelRange: [number, number];
    private input;
    private eventBus;
    constructor(masterChannel: number, memberChannelRange: [number, number], input: MIDIValInput);
    private buildBus;
    private bindEvents;
    onNoteOn(cb: CallbackType<OmnibusParams<typeof this.eventBus, 'noteOn'>>): _hypersphere_omnibus.UnregisterCallback;
    onNoteOff(cb: CallbackType<OmnibusParams<typeof this.eventBus, 'noteOff'>>): _hypersphere_omnibus.UnregisterCallback;
    onMasterPitchBend(cb: CallbackType<OmnibusParams<typeof this.eventBus, 'masterPitchBend'>>): _hypersphere_omnibus.UnregisterCallback;
    onMemberPitchBend(cb: CallbackType<OmnibusParams<typeof this.eventBus, 'memberPitchBend'>>): _hypersphere_omnibus.UnregisterCallback;
    onMasterTimbre(cb: CallbackType<OmnibusParams<typeof this.eventBus, 'masterTimbre'>>): _hypersphere_omnibus.UnregisterCallback;
    onMemberTimbre(cb: CallbackType<OmnibusParams<typeof this.eventBus, 'memberTimbre'>>): _hypersphere_omnibus.UnregisterCallback;
    onMasterPressure(cb: CallbackType<OmnibusParams<typeof this.eventBus, 'masterPressure'>>): _hypersphere_omnibus.UnregisterCallback;
    onMemberPressure(cb: CallbackType<OmnibusParams<typeof this.eventBus, 'memberPressure'>>): _hypersphere_omnibus.UnregisterCallback;
}

interface MPEInputConfig {
    lowerZoneSize?: number;
    upperZoneSize?: number;
}
declare class MPEMidivalInput {
    #private;
    private readonly input;
    private eventBus;
    private buildBus;
    constructor(input: MIDIValInput, mpeDefaultZones?: MPEInputConfig);
    private instantiateLowerZone;
    private instantiateUpperZone;
    get isMpeEnabled(): boolean;
    get lowerZone(): MPEInputZone;
    get upperZone(): MPEInputZone;
    onLowerZoneUpdate(cb: CallbackType<OmnibusParams<typeof this.eventBus, 'lowerZoneUpdate'>>): _hypersphere_omnibus.UnregisterCallback;
    onUpperZoneUpdate(cb: CallbackType<OmnibusParams<typeof this.eventBus, 'upperZoneUpdate'>>): _hypersphere_omnibus.UnregisterCallback;
}

declare class ActiveNote {
    #private;
    readonly note: number;
    readonly velocity: number;
    readonly channel: number;
    private readonly output;
    constructor(note: number, velocity: number, channel: number, output: MIDIValOutput);
    changePressure(pressure: number): void;
    changeBend(newBend: number): void;
    changeTimbre(newSlide: number): void;
    get x(): number;
    get y(): number;
    get z(): number;
    set x(newValue: number);
    set y(newValue: number);
    set z(newValue: number);
    get pitchBend(): number;
    get timbre(): number;
    get pressure(): number;
    get isActive(): boolean;
    noteOff(): void;
}

declare class MPEOutputZone {
    #private;
    private masterChannel;
    private childChannelsRange;
    private output;
    constructor(masterChannel: number, childChannelsRange: [number, number], output: MIDIValOutput);
    private getOpenChannel;
    private forEachMember;
    private get notesPerChannel();
    setMasterPitchBend(value: number): void;
    setMasterTimbre(value: number): void;
    setMasterVelocity(value: number): void;
    setMasterPitchBendSensitivity(semitones: number): void;
    setMemberPitchBendSensitivity(semitones: number): void;
    sendNoteOn(note: number, velocity: number): ActiveNote;
}

interface MPEOutputConfig {
    lowerZoneSize?: number;
    upperZoneSize?: number;
}
declare class MPEMidivalOutput {
    #private;
    private readonly options;
    private midivalOutput;
    get lowerZone(): MPEOutputZone;
    get upperZone(): MPEOutputZone;
    constructor(output: IMIDIOutput, options: MPEOutputConfig);
    disconnect(): void;
}

export { ActiveNote, type ChannelValueMessage, MPEInputZone, MPEMidivalInput, MPEMidivalOutput, type MPEOutputConfig, MPEOutputZone, type MemberPitchBendMessage, type MemberPressureMessage, type MemberTimbreMessage };
