// src/utils/MIDIMessageConvert.ts
var isChannelMode = (channel) => channel >= 120;
var toMidiMessage = ([
  status,
  data1,
  data2
]) => {
  const command = status >> 4 << 4;
  const channel = status - command + 1;
  return {
    channel,
    command,
    data1,
    data2
  };
};

// src/utils/pitchBend.ts
var fractionToPitchBend = (n) => {
  if (n < -1 || n > 1) {
    throw new Error("Pitch bend value outside the range");
  }
  return Math.ceil((n + 1) * 16383 / 2);
};
var fractionToPitchBendAsUints = (n) => {
  return splitNumberIntoUInt8s(fractionToPitchBend(n));
};
var splitNumberIntoUInt8s = (n) => {
  let arr = [];
  arr[0] = (1 << 7) - 1 & n;
  arr[1] = n >> 7;
  return arr;
};
var uIntsIntoNumber = (arr) => {
  return arr[0] + (arr[1] << 7);
};
var splitValueIntoFraction = (arr) => {
  return (uIntsIntoNumber(arr) / 16363 - 0.5) * 2;
};

// src/utils/midiCommands.ts
var MidiCommand = {
  NoteOn: 9 << 4,
  NoteOff: 8 << 4,
  PolyKeyPressure: 10 << 4,
  ControlChange: 11 << 4,
  ProgramChange: 12 << 4,
  ChannelPressure: 13 << 4,
  PitchBend: 14 << 4,
  Sysex: 15 << 4,
  Clock: {
    Start: 250,
    Continue: 251,
    Stop: 252,
    Pulse: 248
  }
};

// src/utils/clock.ts
var sum = (a, b) => a + b;
var computeIntervalsInMs = (ticks) => {
  const results = [];
  for (let i = 1; i < ticks.length; i++) {
    results.push(ticks[i] - ticks[i - 1]);
  }
  return results;
};
var averageIntervals = (differences) => {
  if (!differences || !differences.length) {
    return 0;
  }
  return differences.reduce(sum) / differences.length;
};
var quarternoteToBPM = (interval) => {
  return 6e4 / (interval * 24);
};
var ticksToBPM = (ticks) => {
  if (!ticks || ticks.length < 2) {
    return 0;
  }
  return quarternoteToBPM(averageIntervals(computeIntervalsInMs(ticks)));
};

// src/errors.ts
var MIDIValError = class extends Error {
  constructor(message) {
    super(message);
  }
  get name() {
    return this.constructor.name;
  }
};
var MIDIValConfigurationError = class extends MIDIValError {
};

// src/types/messages.ts
var toNoteMessage = (m) => ({
  ...m,
  note: m.data1,
  velocity: m.data2
});
var toControlChangeMessage = (m) => ({
  ...m,
  control: m.data1,
  value: m.data2
});
var toProgramMessage = (m) => ({
  ...m,
  program: m.data1,
  value: m.data2
});

// src/utils/midiRegisteredParameters.ts
var MIDIRegisteredParameters = {
  PITCH_BEND_SENSITIVITY: [0, 0],
  CHANNEL_FINE_TUNING: [0, 1],
  CHANNEL_COARSE_TUNING: [0, 2],
  TUNING_PROGRAM_CHANGE: [0, 3],
  TUNING_BANK_SELECT: [0, 4],
  MODULATION_DEPTH_CHANGE: [0, 5],
  MPE_CONFIGURATION_MESSAGE: [0, 6]
};
var toRegisteredParameterKey = (data) => {
  for (const [key, value] of Object.entries(MIDIRegisteredParameters)) {
    if (value[0] === data[0] && value[1] === data[1]) {
      return key;
    }
  }
  throw new Error("Unknown registered parameter");
};

// src/buildInputBus.ts
import { Omnibus, args } from "@hypersphere/omnibus";
var buildInputBus = () => {
  return Omnibus.builder().register("pithchBend", args()).register("sysex", args()).register("channelPressure", args()).register("noteOn", args()).register("noteOff", args()).register("controlChange", args()).register("programChange", args()).register("polyKeyPressure", args()).register("clockPulse", args()).register("clockStart", args()).register("clockStop", args()).register("clockContinue", args()).register("registeredParameterData", args()).build();
};

// src/MIDIValInput.ts
var TEMPO_SAMPLES_LIMIT = 20;
var DefaultOptions = {
  computeClockTempo: false
};
var MIDIValInput = class _MIDIValInput {
  constructor(input, options = DefaultOptions) {
    this.options = options;
    this.registerInput(input);
  }
  unregisterInput;
  omnibus = buildInputBus();
  midiInput;
  tempoSamples = [];
  rpn = [-1, -1];
  /**
   * Returns new MIDIValInput object based on the interface id.
   * @param interfaceId id of the interface from the MIDIAcces object.
   * @throws MIDIValError when interface id is not found.
   * @returns Promise resolving to MIDIValInput.
   */
  static async fromInterfaceId(interfaceId, options) {
    const midiAccess = await this.getMidiAccess();
    const input = midiAccess.inputs.find(({ id }) => id === interfaceId);
    if (!input) {
      throw new MIDIValError(`${interfaceId} not found`);
    }
    return new _MIDIValInput(input, options);
  }
  /**
   * Finds first interface matching the name
   * @param interfaceName interface Name
   * @param options input configuration options
   * @throws MIDIValError when no interface with that name is found
   * @returns MIDIValInput object
   */
  static async fromInterfaceName(interfaceName, options) {
    const midiAccess = await this.getMidiAccess();
    const input = midiAccess.inputs.find(({ name }) => name === interfaceName);
    if (!input) {
      throw new MIDIValError(`${interfaceName} not found`);
    }
    return new _MIDIValInput(input, options);
  }
  static async getMidiAccess() {
    const midiAccess = await MIDIVal.connect();
    return midiAccess;
  }
  /**
   * Current MIDI Clock tempo
   * @throws MIDIValConfigurationError when computeClockTempo is not on.
   * @returns current tempo in BPM.
   */
  get tempo() {
    if (!this.options.computeClockTempo) {
      throw new MIDIValConfigurationError(
        "To use MIDIValInput.tempo you need to enable computeClockTempo option."
      );
    }
    return ticksToBPM(this.tempoSamples);
  }
  /**
   * 
   * @param key event you want to listen to
   * @param cb Optional callback to be triggered. If not provided, Promise with the result is returned instead
   * @returns UnregisterCallback if callback provided. Promise resolving to the event value otherwise.
   */
  once(key, cb) {
    return this.omnibus.once(key, cb);
  }
  async registerInput(input) {
    this.midiInput = input;
    this.unregisterInput = await input.onMessage(
      (e) => {
        if (e.data[0] === 240) {
          this.omnibus.trigger("sysex", e.data);
          return;
        }
        if (this.isClockCommand(e)) {
          return;
        }
        const midiMessage = toMidiMessage(e.data);
        switch (midiMessage.command) {
          case MidiCommand.NoteOn:
            this.omnibus.trigger("noteOn", toNoteMessage(midiMessage));
            break;
          case MidiCommand.NoteOff:
            this.omnibus.trigger("noteOff", toNoteMessage(midiMessage));
            break;
          case MidiCommand.ControlChange:
            this.omnibus.trigger(
              "controlChange",
              toControlChangeMessage(midiMessage)
            );
            break;
          case MidiCommand.ProgramChange:
            this.omnibus.trigger(
              "programChange",
              toProgramMessage(midiMessage)
            );
            break;
          case MidiCommand.PolyKeyPressure:
            this.omnibus.trigger("polyKeyPressure", midiMessage);
            break;
          case MidiCommand.PitchBend:
            this.omnibus.trigger("pithchBend", {
              channel: midiMessage.channel,
              value: splitValueIntoFraction([
                midiMessage.data1,
                midiMessage.data2
              ])
            });
            break;
          case MidiCommand.ChannelPressure:
            this.omnibus.trigger("channelPressure", midiMessage);
            break;
          default:
            break;
        }
      }
    );
    if (this.options.computeClockTempo) {
      this.onClockPulse(() => {
        this.tempoSamples.push(performance.now());
        if (this.tempoSamples.length > TEMPO_SAMPLES_LIMIT) {
          this.tempoSamples.shift();
        }
      });
      const resetSamples = () => {
        this.tempoSamples = [];
      };
      this.onClockContinue(resetSamples);
      this.onClockStart(resetSamples);
    }
    this.onControlChange(
      101 /* RegisteredParameterNumberMSB */,
      (message) => {
        this.rpn = [message.data2, this.rpn[1]];
      }
    );
    this.onControlChange(
      100 /* RegisteredParameterNumberLSB */,
      (message) => {
        this.rpn = [this.rpn[0], message.data2];
      }
    );
    this.onControlChange(6 /* DataEntryMSB */, (message) => {
      const key = toRegisteredParameterKey(this.rpn);
      this.omnibus.trigger("registeredParameterData", {
        channel: message.channel,
        parameter: key,
        msb: message.data2,
        lsb: null
      });
    });
    this.onControlChange(38 /* DataEntryLSB */, (message) => {
      const key = toRegisteredParameterKey(this.rpn);
      this.omnibus.trigger("registeredParameterData", {
        channel: message.channel,
        parameter: key,
        msb: null,
        lsb: message.data2
      });
    });
  }
  isClockCommand(e) {
    switch (e.data[0]) {
      case MidiCommand.Clock.Pulse:
        this.omnibus.trigger("clockPulse");
        return true;
      case MidiCommand.Clock.Start:
        this.omnibus.trigger("clockStart");
        return true;
      case MidiCommand.Clock.Continue:
        this.omnibus.trigger("clockContinue");
        return true;
      case MidiCommand.Clock.Stop:
        this.omnibus.trigger("clockStop");
        return true;
      default:
        return false;
    }
  }
  onBusKeyValue(event, key, value, callback) {
    return this.omnibus.on(event, (...args2) => {
      if (!args2.length) {
        return;
      }
      const obj = args2[0];
      if (typeof obj !== "object") {
        return;
      }
      if (obj[key] === value) {
        callback(obj);
      }
    });
  }
  /**
   * Disconnects all listeners.
   */
  disconnect() {
    this.omnibus.offAll();
    if (this.unregisterInput) {
      this.unregisterInput();
    }
  }
  /**
   * Registers new callback on every note on event.
   * @param callback Callback that will get called on each note on event.
   * @returns Callback to unregister.
   */
  onAllNoteOn(callback) {
    return this.omnibus.on("noteOn", callback);
  }
  /**
   * Registers new callback on specific note on event.
   * @param key the key number
   * @param callback Callback that gets called on every note on on this specific key
   * @returns Callback to unregister.
   */
  onNoteOn(key, callback) {
    return this.omnibus.on("noteOn", (midiMessage) => {
      if (midiMessage.note !== key) {
        return;
      }
      return callback(midiMessage);
    });
  }
  /**
   * Registers new callback on all notes off.
   * @param callback Callback that gets called on every note off.
   * @returns Unregister callback
   */
  onAllNoteOff(callback) {
    return this.omnibus.on("noteOff", callback);
  }
  /**
   * Registers new callback on specific note off.
   * @param key key number
   * @param callback Callback that gets called on every note off on this specific key
   * @returns Unregister callback
   */
  onNoteOff(key, callback) {
    return this.onBusKeyValue("noteOff", "note", key, callback);
  }
  /**
   * Registers new callback on pitch bend message
   * @param callback Callback that gets called on every pitch bend message. It gets value of the bend in the range of -1.0 to 1.0 using 16-bit precision (if supported by sending device).
   * @returns Unregister callback.
   */
  onPitchBend(callback) {
    return this.omnibus.on("pithchBend", callback);
  }
  /**
   * Registers callback on every control change message
   * @param callback Callback that will get called on control change.
   * @returns Unregister callback.
   */
  onAllControlChange(callback) {
    return this.omnibus.on("controlChange", callback);
  }
  /**
   * Registers callback on specific control change key.
   * @param channel Control change channel value
   * @param callback Callback to be called
   * @returns Unregister function
   */
  onControlChange(control, callback) {
    if (isChannelMode(control)) {
      console.warn(
        "use designated Channel Mode callback instead of onControlChange for " + control
      );
    }
    return this.omnibus.on("controlChange", (m) => {
      if (m.control !== control) {
        return;
      }
      callback(m);
    });
  }
  /**
   * Registers callback to be called on every program change event
   * @param callback Callback to be called
   * @returns Unregister function.
   */
  onAllProgramChange(callback) {
    return this.omnibus.on("programChange", callback);
  }
  /**
   * Registers callback to be called on specific program change
   * @param key Program value for key change
   * @param callback Callback to be called
   * @returns Unregister function
   */
  onProgramChange(program, callback) {
    return this.onBusKeyValue("programChange", "program", program, callback);
  }
  /**
   * Registers callback on all poly key pressure events
   * @param callback Callback to be called
   * @returns Unregister function
   */
  onAllPolyKeyPressure(callback) {
    return this.omnibus.on("polyKeyPressure", callback);
  }
  /**
   * Registers callback on specific poly key pressure event
   * @param key Key for poly key pressure
   * @param callback Callback to be called
   * @returns Unregister function
   */
  onPolyKeyPressure(key, callback) {
    return this.onBusKeyValue("polyKeyPressure", "data1", key, callback);
  }
  /**
   * Registers callback on sysex message
   * @param callback Callback to be called
   * @returns Unregister callback
   */
  onSysex(callback) {
    return this.omnibus.on("sysex", callback);
  }
  /**
   * Registers callback on all sounds off event
   * @param callback Callback to be called
   * @returns Unregister callback
   */
  onAllSoundsOff(callback) {
    return this.onBusKeyValue(
      "controlChange",
      "control",
      120 /* AllSoundsOff */,
      callback
    );
  }
  /**
   * Registers callback on reset all controllers event
   * @param callback Callback to be called
   * @returns Unregister callback
   */
  onResetAllControllers(callback) {
    return this.onBusKeyValue(
      "controlChange",
      "control",
      121 /* ResetAllControllers */,
      callback
    );
  }
  /**
   * Registers callback on local control change event
   * @param callback Callback to be called: first argument to the callback is a boolean representing if the local control was set on or off
   * @returns Unregister event
   */
  onLocalControlChange(callback) {
    return this.onBusKeyValue(
      "controlChange",
      "control",
      122 /* LocalControlOnOff */,
      (m) => {
        callback(m.data2 === 127, m);
      }
    );
  }
  /**
   * Registers callback on all notes off
   * @param callback Callback to be called
   * @returns Unregister callback
   */
  onAllNotesOff(callback) {
    return this.onBusKeyValue(
      "controlChange",
      "control",
      123 /* AllNotesOff */,
      callback
    );
  }
  onChannelPressure(callback) {
    return this.omnibus.on("channelPressure", callback);
  }
  onOmniModeOff(callback) {
    return this.onBusKeyValue(
      "controlChange",
      "control",
      124 /* OmniModeOff */,
      callback
    );
  }
  onOmniModeOn(callback) {
    return this.onBusKeyValue(
      "controlChange",
      "control",
      125 /* OmniModeOn */,
      callback
    );
  }
  onMonoModeOn(callback) {
    return this.onBusKeyValue(
      "controlChange",
      "control",
      126 /* MonoModeOn */,
      callback
    );
  }
  onPolyModeOn(callback) {
    return this.onBusKeyValue(
      "controlChange",
      "control",
      127 /* PolyModeOn */,
      callback
    );
  }
  onClockPulse(callback) {
    return this.omnibus.on("clockPulse", callback);
  }
  onClockStart(callback) {
    return this.omnibus.on("clockStart", callback);
  }
  onClockStop(callback) {
    return this.omnibus.on("clockStop", callback);
  }
  onClockContinue(callback) {
    return this.omnibus.on("clockContinue", callback);
  }
  // RPN
  onMpeConfiguration(callback) {
    return this.onBusKeyValue(
      "registeredParameterData",
      "parameter",
      "MPE_CONFIGURATION_MESSAGE",
      callback
    );
  }
  onPitchBendSensitivity(callback) {
    return this.onBusKeyValue(
      "registeredParameterData",
      "parameter",
      "PITCH_BEND_SENSITIVITY",
      callback
    );
  }
  onChannelFineTuning(callback) {
    return this.onBusKeyValue(
      "registeredParameterData",
      "parameter",
      "CHANNEL_FINE_TUNING",
      callback
    );
  }
  onChannelCoarseTuning(callback) {
    return this.onBusKeyValue(
      "registeredParameterData",
      "parameter",
      "CHANNEL_COARSE_TUNING",
      callback
    );
  }
  onTuningProgramChange(callback) {
    return this.onBusKeyValue(
      "registeredParameterData",
      "parameter",
      "TUNING_PROGRAM_CHANGE",
      callback
    );
  }
  onTuningBankChange(callback) {
    return this.onBusKeyValue(
      "registeredParameterData",
      "parameter",
      "TUNING_BANK_SELECT",
      callback
    );
  }
  onModulationDepthChange(callback) {
    return this.onBusKeyValue(
      "registeredParameterData",
      "parameter",
      "MODULATION_DEPTH_CHANGE",
      callback
    );
  }
};

// src/MIDIValOutput.ts
var delay = (n) => new Promise((resolve) => setInterval(resolve, n));
var MIDIValOutput = class _MIDIValOutput {
  midiOutput;
  defaultChannel;
  constructor(output) {
    this.midiOutput = output;
    this.defaultChannel = 1;
  }
  /**
   * Sends raw message to MIDI out
   * @param msgs Message as an array of UInt8 values
   * @returns
   */
  send(msgs) {
    if (!this.midiOutput) {
      return;
    }
    this.midiOutput.send(msgs);
  }
  /**
   * Changes default channel the messages are sent on
   * @param channel Channel value. Integer between 1 and 16
   */
  setChannel(channel) {
    this.defaultChannel = channel;
  }
  getChannel(channel) {
    if (!channel) {
      return this.defaultChannel - 1;
    }
    return channel - 1;
  }
  /**
   * Creates MIDIValOutput based on the interface name
   * @param interfaceName Name of the interface
   * @returns MIDIValOutput object
   */
  static async fromInterfaceName(interfaceName) {
    const midiAccess = await this.getMidiAccess();
    const output = midiAccess.outputs.find(
      ({ name }) => name === interfaceName
    );
    if (!output) {
      throw new Error(`${interfaceName} not found`);
    }
    return new _MIDIValOutput(output);
  }
  static async getMidiAccess() {
    const midiAccess = await MIDIVal.connect();
    return midiAccess;
  }
  /**
   * Sends note on message
   * @param note Note key value to be sent.
   * @param velocity Velocity - number between 0 and 128
   * @param channel Channel. By default will use channel set by setChannel method
   * @returns
   */
  sendNoteOn(note, velocity, channel) {
    return this.send([
      MidiCommand.NoteOn + this.getChannel(channel),
      note,
      velocity
    ]);
  }
  /**
   * Sends note off message.
   * @param note Note key to be set off
   * @param channel Channel. By default will use channel set by setChannel method
   * @returns
   */
  sendNoteOff(note, channel) {
    return this.send([MidiCommand.NoteOff + this.getChannel(channel), note, 0]);
  }
  sendPolyKeyPressure(key, velocity, channel) {
    return this.send([
      MidiCommand.PolyKeyPressure + this.getChannel(channel),
      key,
      velocity
    ]);
  }
  sendControlChange(controller, value, channel) {
    return this.send([
      MidiCommand.ControlChange + this.getChannel(channel),
      controller,
      value
    ]);
  }
  sendProgramChange(program, channel) {
    return this.send([
      MidiCommand.ProgramChange + this.getChannel(channel),
      program
    ]);
  }
  sendChannelPressure(velocity, channel) {
    return this.send([
      MidiCommand.ChannelPressure + this.getChannel(channel),
      velocity
    ]);
  }
  /**
   * Sends pitch bend value.
   * @param bendValue Ben value ranging from -1.0 to 1.0.
   * @param channel Optional channel on which bend should be sent on
   * @returns
   * @throws Throws exception if bendValue is outside the range.
   */
  sendPitchBend(bendValue, channel) {
    return this.send(
      new Uint8Array([
        MidiCommand.PitchBend + this.getChannel(channel),
        ...fractionToPitchBendAsUints(bendValue)
      ])
    );
  }
  // Special Channel Modes
  sendAllSoundOff(channel) {
    return this.send([
      MidiCommand.ControlChange + this.getChannel(channel),
      120 /* AllSoundsOff */,
      0
    ]);
  }
  sendResetAllControllers(channel) {
    return this.send([
      MidiCommand.ControlChange + this.getChannel(channel),
      121 /* ResetAllControllers */,
      0
    ]);
  }
  sendLocalControlOff(channel) {
    return this.send([
      MidiCommand.ControlChange + this.getChannel(channel),
      122 /* LocalControlOnOff */,
      0
    ]);
  }
  sendLocalControlOn(channel) {
    return this.send([
      MidiCommand.ControlChange + this.getChannel(channel),
      122 /* LocalControlOnOff */,
      127
    ]);
  }
  sendAllNotesOff(channel) {
    return this.send([
      MidiCommand.ControlChange + this.getChannel(channel),
      123 /* AllNotesOff */,
      0
    ]);
  }
  sendClockStart() {
    return this.send([MidiCommand.Clock.Start]);
  }
  sendClockStop() {
    return this.send([MidiCommand.Clock.Stop]);
  }
  sendClockContinue() {
    return this.send([MidiCommand.Clock.Continue]);
  }
  sendClockPulse() {
    return this.send([MidiCommand.Clock.Pulse]);
  }
  // RPN
  sendRPNSelection([msb, lsb], channel) {
    this.sendControlChange(
      101 /* RegisteredParameterNumberMSB */,
      msb,
      channel
    );
    this.sendControlChange(
      100 /* RegisteredParameterNumberLSB */,
      lsb,
      channel
    );
  }
  sendRPDataMSB(data, channel) {
    this.sendControlChange(6 /* DataEntryMSB */, data, channel);
  }
  sendRPDataLSB(data, channel) {
    this.sendControlChange(38 /* DataEntryLSB */, data, channel);
  }
  incrementRPData(incrementValue, channel) {
    this.sendControlChange(
      96 /* DataIncrement */,
      incrementValue,
      channel
    );
  }
  decrementRPData(decrementValue, channel) {
    this.sendControlChange(
      97 /* DataDecrement */,
      decrementValue,
      channel
    );
  }
  sendRPNNull() {
  }
  async initializeMPE(lowerChannelSize, upperChannelSize, messageDelayMs = 100) {
    this.sendRPNSelection(
      MIDIRegisteredParameters.MPE_CONFIGURATION_MESSAGE,
      1
    );
    await delay(messageDelayMs);
    this.sendRPDataMSB(lowerChannelSize, 1);
    await delay(messageDelayMs);
    this.sendRPDataMSB(upperChannelSize, 16);
    await delay(messageDelayMs);
    this.sendRPNNull();
    await delay(messageDelayMs);
  }
  async setPitchBendSensitivity(semitones, cents, channel, messageDelayMs = 100) {
    this.sendRPNSelection(
      MIDIRegisteredParameters.PITCH_BEND_SENSITIVITY,
      channel
    );
    await delay(messageDelayMs);
    this.sendRPDataMSB(semitones, channel);
    await delay(messageDelayMs);
    this.sendRPNNull();
  }
};

// src/wrappers/outputs/BrowserMIDIOutput.ts
var BrowserMIDIOutput = class {
  output;
  constructor(output) {
    this.output = output;
  }
  send(data) {
    this.output.send(data);
  }
  get id() {
    return this.output.id;
  }
  get name() {
    return this.output.name;
  }
  get manufacturer() {
    return this.output.manufacturer;
  }
};

// src/wrappers/inputs/BrowserMIDIInput.ts
var BrowserMIDIInput = class {
  input;
  constructor(input) {
    this.input = input;
  }
  async onMessage(fn) {
    await this.input.open();
    this.input.addEventListener("midimessage", fn);
    return () => {
      this.input.removeEventListener("midimessage", fn);
    };
  }
  get id() {
    return this.input.id;
  }
  get name() {
    return this.input.name;
  }
  get manufacturer() {
    return this.input.manufacturer;
  }
};

// src/wrappers/access/BrowserMIDIAccess.ts
import { Omnibus as Omnibus2 } from "@hypersphere/omnibus";
var BrowserMIDIAccess = class {
  access;
  bus = new Omnibus2();
  onInputConnected(callback) {
    return this.bus.on("inputConnected", callback);
  }
  onInputDisconnected(callback) {
    return this.bus.on("inputDisconnected", callback);
  }
  onOutputConnected(callback) {
    return this.bus.on("outputConnected", callback);
  }
  onOutputDisconnected(callback) {
    return this.bus.on("outputDisconnected", callback);
  }
  async connect(sysex = false) {
    if (!navigator.requestMIDIAccess) {
      throw new Error(
        "requestMIDIAccess not available, make sure you are using MIDI-compatible browser."
      );
    }
    this.access = await navigator.requestMIDIAccess({ sysex });
    this.listenOnStateChange();
  }
  get outputs() {
    return Array.from(this.access.outputs).map(
      ([, output]) => new BrowserMIDIOutput(output)
    );
  }
  get inputs() {
    return Array.from(this.access.inputs).map(
      ([, input]) => new BrowserMIDIInput(input)
    );
  }
  getInputById(inputId) {
    const input = Array.from(this.access.inputs).map(([, input2]) => input2).find(({ id }) => id === inputId);
    if (!input) {
      throw new Error(`Cannot find input ${inputId}`);
    }
    return new BrowserMIDIInput(input);
  }
  getOutputById(outputId) {
    const output = Array.from(this.access.outputs).map(([, output2]) => output2).find(({ id }) => id === outputId);
    if (!output) {
      throw new Error(`Cannot find output ${outputId}`);
    }
    return new BrowserMIDIOutput(output);
  }
  listenOnStateChange() {
    this.access.addEventListener(
      "statechange",
      (e) => {
        if (e.port.type === "input") {
          switch (e.port.state) {
            case "disconnected":
              this.bus.trigger(
                "inputDisconnected",
                new BrowserMIDIInput(e.port)
              );
              break;
            case "connected":
              this.bus.trigger(
                "inputConnected",
                new BrowserMIDIInput(e.port)
              );
              break;
          }
        } else {
          switch (e.port.state) {
            case "disconnected":
              this.bus.trigger(
                "outputDisconnected",
                new BrowserMIDIOutput(e.port)
              );
              break;
            case "connected":
              this.bus.trigger(
                "outputConnected",
                new BrowserMIDIOutput(e.port)
              );
              break;
          }
        }
      }
    );
  }
};

// src/MIDIval.ts
var matchesConfig = (input, scheme) => {
  return Object.keys(scheme).reduce((acc, key) => {
    const val = scheme[key];
    if (typeof val === "string") {
      return acc && input[key] === val;
    } else {
      return acc && val.test(input[key]);
    }
  }, true);
};
var MIDIVal = class {
  static isSetupComplete = false;
  static accessObject;
  /**
   * Allows to reconfigure access object to use project in different environment as the default one (browser): See @midival/node, @midival/react-native for more details.
   * @param newAccess Implementation of IMIDIAccess to be used to provide MIDI objects.
   */
  static configureAccessObject(newAccess) {
    this.isSetupComplete = false;
    this.accessObject = newAccess;
  }
  /**
   * Calls callback on every input device that gets connected.
   * @param callback Callback to be registered
   * @param callOnAlreadyConnected If set to true, the function will instantly trigger for all already connected devices. Default to false
   * @returns Promise resolving to unregister callback when finishes.
   */
  static async onInputDeviceConnected(callback, callOnAlreadyConnected = false) {
    if (callOnAlreadyConnected) {
      this.accessObject.inputs.forEach(callback);
    }
    return this.accessObject.onInputConnected(callback);
  }
  /**
   * Listens to all input devices with a certain config (like name or manufacturer). Configuration can be provided as a string or regex. The callback unlike `onInputDeviceConnected` accepts MIDIValInput. `onInputDeviceConnected` is suitable when you want to filter devices yourself, beyond this configuration object so it does not instantiate objects.
   * @param config Configuration object used to match with device connected
   * @param fn Callback on connection. Connection is already wrapped in MIDIValInput object
   * @returns Promise for Unregister Callback
   */
  static async onInputDeviceWithConfigConnected(config, fn, callOnAlreadyConnected = false) {
    return this.onInputDeviceConnected((input) => {
      if (matchesConfig(input, config)) {
        fn(new MIDIValInput(input));
      }
    }, callOnAlreadyConnected);
  }
  /**
   * Listens to all output devices with a certain config (like name or manufacturer). Configuration can be provided as a string or regex. The callback unlike `onOutputDeviceConnected` accepts MIDIValOutput. `onOutputDeviceConnected` is suitable when you want to filter devices yourself, beyond this configuration object so it does not instantiate objects.
   * @param config Configuration object used to match with device connected
   * @param fn Callback on connection. Connection is already wrapped in MIDIValOutput object
   * @returns Promise for Unregister Callback
   */
  static async onOutputDeviceWithConfigConnected(config, fn, callOnAlreadyConnected = false) {
    return this.onOutputDeviceConnected((output) => {
      if (matchesConfig(output, config)) {
        fn(new MIDIValOutput(output));
      }
    }, callOnAlreadyConnected);
  }
  /**
   * Calls callback on every output device that gets connected.
   * @param callback Callback to be registered
   * @param callOnAlreadyConnected If set to true, the function will instantly trigger for all already connected devices. Default to false
   * @returns Promise resolving to unregister callback when finishes.
   */
  static async onOutputDeviceConnected(callback, callOnAlreadyConnected = false) {
    if (callOnAlreadyConnected) {
      this.accessObject.outputs.forEach(callback);
    }
    return this.accessObject.onOutputConnected(callback);
  }
  /**
   * Regusters callback on an event of input device being disconnected.
   * @param callback Callback to be called.
   * @returns promise resolving to unregister callback
   */
  static async onInputDeviceDisconnected(callback) {
    return this.accessObject.onInputDisconnected(callback);
  }
  /**
   * Regusters callback on an event of input device being disconnected.
   * @param callback Callback to be called.
   * @returns promise resolving to unregister callback
   */
  static async onOutputDeviceDisconnected(callback) {
    return this.accessObject.onOutputDisconnected(callback);
  }
  /**
   * Creates MIDIValInput instance from implementation of IMIDIInput interface.
   * @param input Implementation of IMIDIInput interface
   * @returns MIDIValInput object
   */
  static fromMIDIInput(input) {
    return new MIDIValInput(input);
  }
  /**
   * Creates MIDIValOutput instance from implementation of IMIDIOut interface
   * @param output Implementation of IMIDIOutput interface
   * @returns MIDIValOutput object
   */
  static fromMIDIOutput(output) {
    return new MIDIValOutput(output);
  }
  /**
   * Connects to MIDI interface and returns implementation of IMIDIAccess
   * @returns Promise resolving to IMIDIAccess
   */
  static async connect() {
    await this.setupDeviceWatchers();
    return this.accessObject;
  }
  static async setupDeviceWatchers() {
    if (this.isSetupComplete) {
      return;
    }
    this.isSetupComplete = true;
    if (!this.accessObject) {
      this.accessObject = new BrowserMIDIAccess();
    }
    await this.accessObject.connect();
  }
};

// src/index.ts
import { CallbackType, UnregisterCallback as UnregisterCallback2 } from "@hypersphere/omnibus";

export {
  MIDIValInput,
  MIDIValOutput,
  MIDIVal,
  CallbackType,
  UnregisterCallback2 as UnregisterCallback
};
