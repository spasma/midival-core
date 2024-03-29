import {
  MIDIValOutput
} from "./chunk-HLS2L7BC.mjs";

// src/mpe/input/MPEMidivalInput.ts
import { Omnibus as Omnibus2, args as args2 } from "@hypersphere/omnibus";

// src/mpe/input/MPEInputZone.ts
import { Omnibus, args } from "@hypersphere/omnibus";
var MPEInputZone = class {
  constructor(masterChannel, memberChannelRange, input) {
    this.masterChannel = masterChannel;
    this.memberChannelRange = memberChannelRange;
    this.input = input;
    this.bindEvents();
  }
  eventBus = this.buildBus();
  #pitchBend = 0;
  #timbre = 0;
  #pressure = 0;
  buildBus() {
    return Omnibus.builder().register("noteOn", args()).register("noteOff", args()).register("masterPitchBend", args()).register("memberPitchBend", args()).register("masterTimbre", args()).register("memberTimbre", args()).register("masterPressure", args()).register("memberPressure", args()).build();
  }
  bindEvents() {
    const [minCh, maxCh] = this.memberChannelRange;
    this.input.onAllNoteOn((note) => {
      if (note.channel >= minCh && note.channel <= maxCh) {
        this.eventBus.trigger("noteOn", note);
      }
    });
    this.input.onAllNoteOff((note) => {
      if (note.channel >= minCh && note.channel <= maxCh) {
        this.eventBus.trigger("noteOff", note);
      }
    });
    this.input.onPitchBend((pitchBend) => {
      if (pitchBend.channel === this.masterChannel) {
        this.eventBus.trigger("masterPitchBend", pitchBend);
        this.#pitchBend = pitchBend.value;
        return;
      }
      if (pitchBend.channel >= minCh && pitchBend.channel <= maxCh) {
        this.eventBus.trigger("memberPitchBend", {
          channel: pitchBend.channel,
          memberPitchBend: pitchBend.value,
          masterPitchBend: this.#pitchBend
        });
      }
    });
    this.input.onChannelPressure((message) => {
      if (message.channel === this.masterChannel) {
        this.eventBus.trigger("masterPressure", {
          channel: message.channel,
          value: message.data2
        });
        this.#pressure = message.data2;
        return;
      }
      if (message.channel >= minCh && message.channel <= maxCh) {
        this.eventBus.trigger("memberPressure", {
          channel: message.channel,
          memberPressure: message.data2,
          masterPressure: this.#pressure
        });
      }
    });
    this.input.onControlChange(74, (message) => {
      if (message.channel === this.masterChannel) {
        this.eventBus.trigger("masterTimbre", {
          channel: message.channel,
          value: message.data2
        });
        this.#timbre = message.data2;
        return;
      }
      if (message.channel >= minCh && message.channel <= maxCh) {
        this.eventBus.trigger("memberTimbre", {
          channel: message.channel,
          memberTimbre: message.data2,
          masterTimbre: this.#timbre
        });
      }
    });
  }
  onNoteOn(cb) {
    return this.eventBus.on("noteOn", cb);
  }
  onNoteOff(cb) {
    return this.eventBus.on("noteOff", cb);
  }
  onMasterPitchBend(cb) {
    return this.eventBus.on("masterPitchBend", cb);
  }
  onMemberPitchBend(cb) {
    return this.eventBus.on("memberPitchBend", cb);
  }
  onMasterTimbre(cb) {
    return this.eventBus.on("masterTimbre", cb);
  }
  onMemberTimbre(cb) {
    return this.eventBus.on("memberTimbre", cb);
  }
  onMasterPressure(cb) {
    return this.eventBus.on("masterPressure", cb);
  }
  onMemberPressure(cb) {
    return this.eventBus.on("memberPressure", cb);
  }
};

// src/mpe/input/MPEMidivalInput.ts
var MPEMidivalInput = class {
  constructor(input, mpeDefaultZones) {
    this.input = input;
    input.onMpeConfiguration(({ channel, msb }) => {
      if (channel === 1) {
        this.instantiateLowerZone(msb);
      }
      if (channel === 16) {
        this.instantiateUpperZone(msb);
      }
    });
    if (mpeDefaultZones?.lowerZoneSize) {
      this.instantiateLowerZone(mpeDefaultZones.lowerZoneSize);
    }
    if (mpeDefaultZones?.upperZoneSize) {
      this.instantiateUpperZone(mpeDefaultZones.upperZoneSize);
    }
  }
  eventBus = this.buildBus();
  #lowerZone;
  #upperZone;
  buildBus() {
    return Omnibus2.builder().register("lowerZoneUpdate", args2()).register("upperZoneUpdate", args2()).build();
  }
  instantiateLowerZone(size) {
    if (!size) {
      this.#lowerZone = null;
    } else {
      this.#lowerZone = new MPEInputZone(1, [2, 1 + size], this.input);
    }
    this.eventBus.trigger("lowerZoneUpdate", this.#lowerZone);
  }
  instantiateUpperZone(size) {
    if (!size) {
      this.#upperZone = null;
    } else {
      this.#upperZone = new MPEInputZone(16, [15 - size, 15], this.input);
    }
    this.eventBus.trigger("upperZoneUpdate", this.#upperZone);
  }
  get isMpeEnabled() {
    return this.#lowerZone !== null || this.#upperZone !== null;
  }
  get lowerZone() {
    return this.#lowerZone;
  }
  get upperZone() {
    return this.#upperZone;
  }
  onLowerZoneUpdate(cb) {
    const callback = this.eventBus.on("lowerZoneUpdate", cb);
    if (this.lowerZone) {
      this.eventBus.trigger("lowerZoneUpdate", this.lowerZone);
    }
    return callback;
  }
  onUpperZoneUpdate(cb) {
    const callback = this.eventBus.on("upperZoneUpdate", cb);
    if (this.upperZone) {
      this.eventBus.trigger("upperZoneUpdate", this.upperZone);
    }
    return callback;
  }
};

// src/mpe/output/ActiveNote.ts
var ActiveNote = class {
  constructor(note, velocity, channel, output) {
    this.note = note;
    this.velocity = velocity;
    this.channel = channel;
    this.output = output;
    this.output.sendNoteOn(note, velocity, channel);
  }
  #pitchBend = 0;
  #timbre = 0;
  #pressure = 0;
  #isActive = true;
  changePressure(pressure) {
    if (!this.isActive) {
      return;
    }
    this.output.sendChannelPressure(pressure, this.channel);
    this.#pressure = pressure;
  }
  changeBend(newBend) {
    if (!this.isActive) {
      return;
    }
    this.output.sendPitchBend(newBend, this.channel);
    this.#pitchBend = newBend;
  }
  changeTimbre(newSlide) {
    if (!this.isActive) {
      return;
    }
    this.output.sendControlChange(74, newSlide, this.channel);
    this.#timbre = newSlide;
  }
  get x() {
    return this.#pitchBend;
  }
  get y() {
    return this.#timbre;
  }
  get z() {
    return this.#pressure;
  }
  set x(newValue) {
    this.changeBend(newValue);
  }
  set y(newValue) {
    this.changeTimbre(newValue);
  }
  set z(newValue) {
    this.changePressure(newValue);
  }
  get pitchBend() {
    return this.#pitchBend;
  }
  get timbre() {
    return this.#timbre;
  }
  get pressure() {
    return this.#pressure;
  }
  get isActive() {
    return this.#isActive;
  }
  noteOff() {
    this.output.sendNoteOff(this.note, this.channel);
    this.#isActive = false;
  }
};

// src/mpe/output/MPEOutputZone.ts
var MPEOutputZone = class {
  constructor(masterChannel, childChannelsRange, output) {
    this.masterChannel = masterChannel;
    this.childChannelsRange = childChannelsRange;
    this.output = output;
  }
  #notes = [];
  getOpenChannel() {
    const ch = this.notesPerChannel;
    const min = Math.min(...Array.from(ch.values()));
    for (const [key, value] of ch.entries()) {
      if (value === min) {
        return key;
      }
    }
  }
  forEachMember(fn) {
    const [minCh, maxCh] = this.childChannelsRange;
    for (let i = minCh; i < maxCh; i++) {
      fn(i);
    }
  }
  get notesPerChannel() {
    const [minCh, maxCh] = this.childChannelsRange;
    const ch = /* @__PURE__ */ new Map();
    for (let i = minCh; i < maxCh; i++) {
      ch.set(i, 0);
    }
    this.#notes.forEach((n) => {
      ch.set(n.channel, ch.get(n.channel) + 1);
    });
    this.#notes = this.#notes.filter((n) => n.isActive);
    return ch;
  }
  setMasterPitchBend(value) {
    this.output.sendPitchBend(value, this.masterChannel);
  }
  setMasterTimbre(value) {
    this.output.sendControlChange(74, value, this.masterChannel);
  }
  setMasterVelocity(value) {
    this.output.sendChannelPressure(value, this.masterChannel);
  }
  setMasterPitchBendSensitivity(semitones) {
    this.output.setPitchBendSensitivity(semitones, 0, this.masterChannel);
  }
  setMemberPitchBendSensitivity(semitones) {
    this.forEachMember((channel) => {
      this.output.setPitchBendSensitivity(semitones, 0, channel);
    });
  }
  sendNoteOn(note, velocity) {
    const channel = this.getOpenChannel();
    const activeNote = new ActiveNote(note, velocity, channel, this.output);
    this.#notes.push(activeNote);
    return activeNote;
  }
};

// src/mpe/output/MPEMidivalOutput.ts
var MPEMidivalOutput = class {
  constructor(output, options) {
    this.options = options;
    this.midivalOutput = new MIDIValOutput(output);
    this.midivalOutput.initializeMPE(
      this.options.lowerZoneSize || 0,
      this.options.upperZoneSize || 0,
      10
    );
    if (this.options.lowerZoneSize) {
      this.#lowerZone = new MPEOutputZone(
        1,
        [2, 2 + this.options.lowerZoneSize],
        this.midivalOutput
      );
    }
    if (this.options.upperZoneSize) {
      this.#upperZone = new MPEOutputZone(
        16,
        [15 - this.options.upperZoneSize, 15],
        this.midivalOutput
      );
    }
  }
  midivalOutput;
  #lowerZone = null;
  #upperZone = null;
  get lowerZone() {
    return this.#lowerZone;
  }
  get upperZone() {
    return this.#upperZone;
  }
  disconnect() {
    this.midivalOutput.initializeMPE(0, 0);
    this.#lowerZone = null;
    this.#upperZone = null;
  }
};
export {
  ActiveNote,
  MPEInputZone,
  MPEMidivalInput,
  MPEMidivalOutput,
  MPEOutputZone
};
