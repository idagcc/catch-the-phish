#!/usr/bin/env python3
"""Create the game's original, circularly rendered 48-second stereo score.

Requires numpy and ffmpeg. No samples, downloaded music, or external audio assets.
"""
from pathlib import Path
import json
import shutil
import subprocess
import tempfile
import wave

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "audio"
SR = 48000
BPM = 80
BEAT = 60 / BPM
BAR = BEAT * 4
DURATION = BAR * 16
LENGTH = round(DURATION * SR)
RNG = np.random.default_rng(245179)
mix = np.zeros((LENGTH, 2), dtype=np.float64)


def hz(note):
    return 440 * 2 ** ((note - 69) / 12)


def add(signal, start, pan=0.0, level=1.0):
    """Wrap every voice's release around the loop, preserving the boundary."""
    signal = np.asarray(signal)
    if signal.ndim == 1:
        angle = (np.clip(pan, -1, 1) + 1) * np.pi / 4
        signal = np.column_stack((signal * np.cos(angle), signal * np.sin(angle)))
    signal = signal * level
    offset = round(start * SR) % LENGTH
    first = min(len(signal), LENGTH - offset)
    mix[offset:offset + first] += signal[:first]
    if first < len(signal):
        mix[:len(signal) - first] += signal[first:]


def pad(note, start, sustain, pan, level):
    attack, release = 1.6, 2.0
    length = sustain + attack + release
    t = np.arange(round(length * SR)) / SR
    envelope = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, length - t) / release)
    envelope = np.sin(np.clip(envelope, 0, 1) * np.pi / 2) ** 1.5
    frequency = hz(note)
    phase = RNG.uniform(0, np.pi * 2)
    voices = []
    for channel, detune in enumerate((-0.0008, 0.0008)):
        phase_t = 2 * np.pi * frequency * (1 + detune) * t + phase
        soft = np.sin(phase_t) + 0.16 * np.sin(2 * phase_t + 0.3) + 0.055 * np.sin(3 * phase_t)
        drift = 0.91 + 0.09 * np.sin(2 * np.pi * 0.17 * t + channel * 1.8)
        voices.append(soft * envelope * drift)
    stereo = np.column_stack(voices)
    stereo[:, 0] *= np.sqrt((1 - pan * 0.6) / 2)
    stereo[:, 1] *= np.sqrt((1 + pan * 0.6) / 2)
    add(stereo, start - attack, level=level)


def pluck(note, start, pan, velocity=1.0):
    duration = 1.8
    t = np.arange(round(duration * SR)) / SR
    f = hz(note)
    envelope = (1 - np.exp(-t / 0.006)) * np.exp(-t / 0.29)
    fundamental = np.sin(2 * np.pi * f * t)
    glass = 0.2 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.11)
    air = 0.045 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t / 0.055)
    add((fundamental + glass + air) * envelope, start, pan, 0.055 * velocity)


def bass(note, start, velocity=1.0):
    t = np.arange(round(1.5 * SR)) / SR
    envelope = (1 - np.exp(-t / 0.03)) * np.exp(-t / 0.58)
    signal = np.sin(2 * np.pi * hz(note) * t) + 0.12 * np.sin(4 * np.pi * hz(note) * t)
    add(signal * envelope, start, level=0.13 * velocity)


def kick(start, level=1.0):
    t = np.arange(round(0.36 * SR)) / SR
    # Smooth sine body; deliberately restrained, without a sharp attack.
    phase = 2 * np.pi * (42 * t + (65 - 42) * 0.025 * (1 - np.exp(-t / 0.025)))
    envelope = (1 - np.exp(-t / 0.003)) * np.exp(-t / 0.09)
    add(np.sin(phase) * envelope, start, level=0.05 * level)


def tick(start, level=1.0, pan=0.0):
    t = np.arange(round(0.065 * SR)) / SR
    noise = RNG.normal(0, 1, len(t))
    bright = noise - np.convolve(noise, np.ones(19) / 19, mode="same")
    envelope = (1 - np.exp(-t / 0.001)) * np.exp(-t / 0.012)
    add(bright * envelope, start, pan, 0.009 * level)


# E minor 9 → C major 9 → G major 9 → D six/add-nine.
# Each harmonic region lasts four bars; all notes and patterns are composed here.
chords = [
    {"pad": [40, 55, 59, 62, 66], "arp": [64, 67, 71, 74, 78], "bass": 40},
    {"pad": [36, 55, 59, 62, 64], "arp": [64, 67, 71, 74, 76], "bass": 36},
    {"pad": [43, 54, 57, 59, 62], "arp": [62, 66, 69, 71, 74], "bass": 43},
    {"pad": [38, 54, 57, 59, 64], "arp": [62, 66, 69, 71, 76], "bass": 38},
]
pattern = [0, 2, 1, 3, 0, 4, 2, 3]
for region, chord in enumerate(chords):
    start = region * BAR * 4
    for index, note in enumerate(chord["pad"]):
        pad(note, start, BAR * 4, (index - 2) * 0.31, 0.052 if index else 0.048)
    for bar in range(4):
        bar_start = start + bar * BAR
        bass(chord["bass"], bar_start, 0.78)
        bass(chord["bass"] + (7 if bar == 3 else 0), bar_start + BEAT * 2, 0.48)
        kick(bar_start)
        kick(bar_start + BEAT * 2, 0.62)
        for eighth in range(8):
            velocity = [0.95, 0.55, 0.73, 0.48, 0.85, 0.52, 0.67, 0.46][eighth]
            note_index = pattern[(eighth + (2 if bar == 3 else 0)) % 8]
            pluck(chord["arp"][note_index], bar_start + eighth * BEAT / 2, (-1 if eighth % 2 else 1) * 0.28, velocity)
            tick(bar_start + eighth * BEAT / 2, 0.8 if eighth % 2 else 0.45, (-1 if eighth % 2 else 1) * 0.45)

# Circular stereo echoes provide a continuous tail at both ends of the loop.
dry = mix.copy()
for seconds, amount in [(BEAT / 2, 0.19), (BEAT * 0.75, 0.13), (BEAT, 0.11), (BEAT * 1.5, 0.075), (BEAT * 2, 0.045)]:
    delayed = np.roll(dry[:, ::-1], round(seconds * SR), axis=0)
    mix += delayed * amount
mix -= np.mean(mix, axis=0)
mix = np.tanh(mix * 1.25)
mix *= 0.79 / np.max(np.abs(mix))
pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2')
OUTPUT.mkdir(parents=True, exist_ok=True)
ffmpeg = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
with tempfile.TemporaryDirectory(prefix="catch-phish-audio-") as temp:
    wav_path = Path(temp) / "score.wav"
    with wave.open(str(wav_path), 'wb') as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(SR)
        handle.writeframes(pcm.tobytes())
    subprocess.run([
        ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav_path),
        '-c:a', 'libopus', '-b:a', '112k', '-vbr', 'on', '-application', 'audio',
        '-metadata', 'title=Catch the Phish — Signal Drift',
        '-metadata', 'artist=Original procedural composition for IDA',
        str(OUTPUT / "cyber-loop.ogg"),
    ], check=True)

metrics = {
    "duration_seconds": DURATION,
    "sample_rate": SR,
    "channels": 2,
    "bpm": BPM,
    "peak_dbfs": float(20 * np.log10(np.max(np.abs(mix)))),
    "rms_dbfs": float(20 * np.log10(np.sqrt(np.mean(mix ** 2)))),
    "boundary_step": float(np.max(np.abs(mix[0] - mix[-1]))),
    "file_bytes": (OUTPUT / "cyber-loop.ogg").stat().st_size,
}
print(json.dumps(metrics, indent=2))
