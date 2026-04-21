export class LengthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LengthError";
  }
}

export class ParamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParamError";
  }
}

export class InvalidValueError extends Error {

  constructor(message: string) {
    super(message);
    this.name = "InvalidValueError";
  }
}
