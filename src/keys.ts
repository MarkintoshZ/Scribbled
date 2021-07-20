/**
 * @module Define key combination literal types and key match function
 */

type KeyModifier = 'Shift' | 'Ctrl' | 'Alt' | 'Meta';

type AltLeft = 'AltLeft';
type AltRight = 'AltRight';
type ArrowDown = 'ArrowDown';
type ArrowLeft = 'ArrowLeft';
type ArrowRight = 'ArrowRight';
type ArrowUp = 'ArrowUp';
type Backquote = 'Backquote';
type Backslash = 'Backslash';
type Backspace = 'Backspace';
type BracketLeft = 'BracketLeft';
type BracketRight = 'BracketRight';
type CapsLock = 'CapsLock';
type Comma = 'Comma';
type ContextMenu = 'ContextMenu';
type ControlLeft = 'ControlLeft';
type ControlRight = 'ControlRight';
type Delete = 'Delete';
type Digit0 = 'Digit0';
type Digit1 = 'Digit1';
type Digit2 = 'Digit2';
type Digit3 = 'Digit3';
type Digit4 = 'Digit4';
type Digit5 = 'Digit5';
type Digit6 = 'Digit6';
type Digit7 = 'Digit7';
type Digit8 = 'Digit8';
type Digit9 = 'Digit9';
type End = 'End';
type Enter = 'Enter';
type Equal = 'Equal';
type Escape = 'Escape';
type F1 = 'F1';
type F2 = 'F2';
type F3 = 'F3';
type F4 = 'F4';
type F5 = 'F5';
type F6 = 'F6';
type F7 = 'F7';
type F8 = 'F8';
type F9 = 'F9';
type F10 = 'F10';
type F11 = 'F11';
type F12 = 'F12';
type Home = 'Home';
type Insert = 'Insert';
type KeyA = 'KeyA';
type KeyB = 'KeyB';
type KeyC = 'KeyC';
type KeyD = 'KeyD';
type KeyE = 'KeyE';
type KeyF = 'KeyF';
type KeyG = 'KeyG';
type KeyH = 'KeyH';
type KeyI = 'KeyI';
type KeyJ = 'KeyJ';
type KeyK = 'KeyK';
type KeyL = 'KeyL';
type KeyM = 'KeyM';
type KeyN = 'KeyN';
type KeyO = 'KeyO';
type KeyP = 'KeyP';
type KeyQ = 'KeyQ';
type KeyR = 'KeyR';
type KeyS = 'KeyS';
type KeyT = 'KeyT';
type KeyU = 'KeyU';
type KeyV = 'KeyV';
type KeyW = 'KeyW';
type KeyX = 'KeyX';
type KeyY = 'KeyY';
type KeyZ = 'KeyZ';
type MetaLeft = 'MetaLeft';
type MetaRight = 'MetaRight';
type Minus = 'Minus';
type NumLock = 'NumLock';
type Numpad0 = 'Numpad0';
type Numpad1 = 'Numpad1';
type Numpad2 = 'Numpad2';
type Numpad3 = 'Numpad3';
type Numpad4 = 'Numpad4';
type Numpad5 = 'Numpad5';
type Numpad6 = 'Numpad6';
type Numpad7 = 'Numpad7';
type Numpad8 = 'Numpad8';
type Numpad9 = 'Numpad9';
type NumpadAdd = 'NumpadAdd';
type NumpadDecimal = 'NumpadDecimal';
type NumpadDivide = 'NumpadDivide';
type NumpadMultiply = 'NumpadMultiply';
type NumpadSubtract = 'NumpadSubtract';
type PageDown = 'PageDown';
type PageUp = 'PageUp';
type Pause = 'Pause';
type Period = 'Period';
type PrintScreen = 'PrintScreen';
type Quote = 'Quote';
type ScrollLock = 'ScrollLock';
type Semicolon = 'Semicolon';
type ShiftLeft = 'ShiftLeft';
type ShiftRight = 'ShiftRight';
type Slash = 'Slash';
type Space = 'Space';
type Tab = 'Tab';

type Key =
  | AltLeft
  | AltRight
  | ArrowDown
  | ArrowLeft
  | ArrowRight
  | ArrowUp
  | Backquote
  | Backslash
  | Backspace
  | BracketLeft
  | BracketRight
  | CapsLock
  | Comma
  | ContextMenu
  | ControlLeft
  | ControlRight
  | Delete
  | Digit0
  | Digit1
  | Digit2
  | Digit3
  | Digit4
  | Digit5
  | Digit6
  | Digit7
  | Digit8
  | Digit9
  | End
  | Enter
  | Equal
  | Escape
  | F1
  | F2
  | F3
  | F4
  | F5
  | F6
  | F7
  | F8
  | F9
  | F10
  | F11
  | F12
  | Home
  | Insert
  | KeyA
  | KeyB
  | KeyC
  | KeyD
  | KeyE
  | KeyF
  | KeyG
  | KeyH
  | KeyI
  | KeyJ
  | KeyK
  | KeyL
  | KeyM
  | KeyN
  | KeyO
  | KeyP
  | KeyQ
  | KeyR
  | KeyS
  | KeyT
  | KeyU
  | KeyV
  | KeyW
  | KeyX
  | KeyY
  | KeyZ
  | MetaLeft
  | MetaRight
  | Minus
  | NumLock
  | Numpad0
  | Numpad1
  | Numpad2
  | Numpad3
  | Numpad4
  | Numpad5
  | Numpad6
  | Numpad7
  | Numpad8
  | Numpad9
  | NumpadAdd
  | NumpadDecimal
  | NumpadDivide
  | NumpadMultiply
  | NumpadSubtract
  | PageDown
  | PageUp
  | Pause
  | Period
  | PrintScreen
  | Quote
  | ScrollLock
  | Semicolon
  | ShiftLeft
  | ShiftRight
  | Slash
  | Space
  | Tab

export type KeyCombination =
  | KeyModifier
  | Key
  | `${KeyModifier}+${Key}`
  | `${KeyModifier2}+${Key}`
  | `${KeyModifier3}+${Key}`;

// helper type
type StringLike<T> = T extends string ? T : never;

// de-duplication 
/**
 * @typedef Combination of two different StringLike Types in the form of 'A+B'
 */
type Comb2<A, B> = A extends infer U
  ? B extends infer V
  ? U extends V
  ? never : `${StringLike<U>}+${StringLike<V>}`
  : never : never;
type KeyModifier2 = Comb2<KeyModifier, KeyModifier>;

/**
 * @typedef Combination of three different StringLike Types in the form of 'A+B'
 */
type Comb3<A, B, C> = A extends infer U
  ? B extends infer V
  ? C extends infer W
  ? U extends V ? never : V extends W
  ? never : `${StringLike<U>}+${StringLike<V>}`
  : never : never : never;
type KeyModifier3 = Comb3<KeyModifier, KeyModifier, KeyModifier>;

/**
 * @param e KeyboardEvent
 * @param key KeyCombination string or a array of KeyCombinations
 * @returns true if the key event matches any of the KeyCombinations passed in
 */
export const matchKey = (
  e: KeyboardEvent, key: KeyCombination | KeyCombination[]
): boolean => {
  if (typeof key == 'string') {
    key = [key];
  }
  return key.some((k) => {
    const ctrl = k.includes('Ctrl');
    const shift = k.includes('Shift');
    const alt = k.includes('Alt');
    const meta = k.includes('Meta');
    // only a modifier key
    if (['Ctrl', 'Shift', 'Alt', 'Meta'].includes(k)) {
      return e.ctrlKey == ctrl &&
        e.shiftKey == shift &&
        e.altKey == alt &&
        e.metaKey == meta;
    }
    // key or modifier(s) + key
    const code = k.split('+').pop();
    return e.ctrlKey == ctrl &&
      e.shiftKey == shift &&
      e.altKey == alt &&
      e.metaKey == meta &&
      e.code == code;
  });
};
