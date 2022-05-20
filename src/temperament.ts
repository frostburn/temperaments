import type {Monzo} from './monzo';
import Algebra = require('ganja.js');
import {LOG_PRIMES} from './constants';
import {gcd, iteratedEuclid} from './utils';

// No interpretation in Geometric Algebra
export type Mapping = number[];

// Promoted to vectors in Geometric Algebra
export type Val = number[];

// Promoted to pseudovectors in GA
export type Comma = number[];

// The weighting vector
// I think ganja.js ignores metric magnitude so we pre- and post-process
export type Metric = number[];

export type Subgroup = number[];

export function inverseLogMetric(subgroup: Subgroup): Metric {
  return subgroup.map(index => 1 / LOG_PRIMES[index]);
}

export function flatMetric(subgroup: Subgroup): Metric;
export function flatMetric(subgroupSize: number): Metric;
export function flatMetric(subgroupOrSize: number | Subgroup) {
  if (typeof subgroupOrSize === 'number') {
    return Array(subgroupOrSize).fill(1);
  }
  return Array(subgroupOrSize.length).fill(1);
}

export function natsToCents(nats: number) {
  return (nats / Math.LN2) * 1200;
}

export function centsToNats(cents: number) {
  return (cents / 1200) * Math.LN2;
}

export function inferSubgroup(monzos: Monzo[]): Subgroup {
  const result: Subgroup = [];
  if (!monzos.length) {
    return result;
  }
  for (let i = 0; i < monzos[0].length; ++i) {
    let hasComponent = false;
    monzos.forEach(monzo => {
      if (monzo[i] !== 0) {
        hasComponent = true;
      }
    });
    if (hasComponent) {
      result.push(i);
    }
  }
  return result;
}

export function patentVal(
  divisions: number,
  equave: number,
  numberOfComponents: number
) {
  const divisionsPerLogEquave = divisions / Math.log(equave);
  return LOG_PRIMES.slice(0, numberOfComponents).map(logPrime =>
    Math.round(logPrime * divisionsPerLogEquave)
  );
}

function isDigit(character: string) {
  return '0123456789'.includes(character);
}

export function fromWarts(
  token: string,
  equave: number,
  numberOfComponents: number
) {
  let numString = '';
  while (isDigit(token[0])) {
    numString += token[0];
    token = token.slice(1);
  }
  const divisions = parseInt(numString);
  const val = patentVal(divisions, equave, numberOfComponents);
  const warts = token
    .toLowerCase()
    .split('')
    .map(w => w.charCodeAt(0) - 97);
  const counts = new Map();
  warts.forEach(index => {
    counts.set(index, (counts.get(index) || 0) + 1);
  });
  for (const [index, count] of counts) {
    const modification = Math.floor((count + 1) / 2) * (2 * (count % 2) - 1);
    if (val[index] > LOG_PRIMES[index]) {
      val[index] -= modification;
    } else {
      val[index] += modification;
    }
  }
  return val;
}

// Musical temperament represented in Geometric Algebra
export class Temperament {
  algebra: any; // Clifford Algebra
  value: any; // Multivector of the Clifford Algebra
  subgroup: Subgroup;

  constructor(algebra: any, value: any, subgroup: Subgroup) {
    this.algebra = algebra;
    this.value = value;
    this.subgroup = subgroup;
  }

  isNil() {
    for (let i = 0; i < this.value.length; ++i) {
      if (this.value[i]) {
        return false;
      }
    }
    return true;
  }

  canonize() {
    for (let i = 0; i < this.subgroup.length - 1; ++i) {
      if (this.subgroup[i] >= this.subgroup[i + 1]) {
        throw new Error('Out of order subgroup');
      }
    }
    let firstSign = 0;
    let commonFactor = 0;
    for (let i = 0; i < this.value.length; ++i) {
      commonFactor = gcd(commonFactor, Math.abs(this.value[i]));
      if (!firstSign && this.value[i]) {
        firstSign = Math.sign(this.value[i]);
      }
    }
    if (!commonFactor) {
      return;
    }
    for (let i = 0; i < this.value.length; ++i) {
      this.value[i] *= firstSign / commonFactor;
      if (Object.is(this.value[i], -0)) {
        this.value[i] = 0;
      }
    }
  }

  // Only checks numerical equality, canonize your inputs beforehand
  equals(other: Temperament) {
    if (this.subgroup.length !== other.subgroup.length) {
      return false;
    }
    for (let i = 0; i < this.subgroup.length; ++i) {
      if (this.subgroup[i] !== other.subgroup[i]) {
        return false;
      }
    }
    for (let i = 0; i < this.value.length; ++i) {
      if (this.value[i] !== other.value[i]) {
        return false;
      }
    }
    return true;
  }

  toTenneyEuclid(metric_?: Metric): Mapping {
    const metric =
      metric_ === undefined ? inverseLogMetric(this.subgroup) : metric_;
    const jip = this.subgroup.map((index, i) => LOG_PRIMES[index] * metric[i]);
    const vector = Array(1 << this.subgroup.length).fill(0);
    vector.splice(1, jip.length, ...jip);
    const promotedJip = new this.algebra(vector);

    const weightedValue_: number[] = [];
    (this.algebra.describe().basis as string[]).forEach((label, index) => {
      let component = this.value[index];
      if (label[0] === 'e') {
        label
          .slice(1)
          .split('')
          .forEach(i => (component *= metric[parseInt(i) - 1]));
      }
      weightedValue_.push(component);
    });
    const weightedValue = new this.algebra(weightedValue_);

    const projected = promotedJip.Dot(weightedValue).Div(weightedValue);

    const result = LOG_PRIMES.slice(
      0,
      1 + this.subgroup.reduce((a, b) => Math.max(a, b))
    );
    this.subgroup.forEach((index, i) => {
      result[index] = projected[1 + i] / metric[i];
    });
    return result;
  }

  toPOTE(metric?: Metric): Mapping {
    const result = this.toTenneyEuclid(metric);
    const indexOfEquivalence = this.subgroup.reduce((a, b) => Math.min(a, b));
    const purifier =
      LOG_PRIMES[indexOfEquivalence] / result[indexOfEquivalence];
    return result.map(component => component * purifier);
  }

  // Assumes this is canonized rank-2
  divisionsGenerator(equaveIndex = 0) {
    const algebraSize = 1 << this.subgroup.length;
    const equaveUnit_ = Array(algebraSize).fill(0);
    equaveUnit_[1 + equaveIndex] = 1;
    const equaveUnit = new this.algebra(equaveUnit_);
    const equaveProj = equaveUnit.Dot(this.value);
    const generator = new this.algebra(iteratedEuclid(equaveProj));
    const divisions = Math.abs(generator.Dot(equaveProj).s);

    const superSize = this.subgroup.reduce((a, b) => Math.max(a, b)) + 1;
    const result: [number, number[]] = [divisions, Array(superSize).fill(0)];
    this.subgroup.forEach((index, i) => {
      result[1][index] = generator[i + 1];
    });
    return result;
  }

  rank2Prefix(): number[] {
    return [
      ...this.value.slice(1 + this.subgroup.length, 2 * this.subgroup.length),
    ];
  }

  static fromValList(vals: Val[], subgroup_?: Subgroup) {
    let subgroup: Subgroup = [];
    if (subgroup_ === undefined) {
      if (!vals.length) {
        throw new Error('No vals or subgroup given');
      }
      for (let i = 0; i < vals[0].length; ++i) {
        subgroup.push(i);
      }
    } else {
      subgroup = subgroup_;
    }

    const Clifford = Algebra(subgroup.length);
    const algebraSize = 1 << subgroup.length;

    if (!vals.length) {
      const scalar = Array(algebraSize).fill(0);
      scalar[0] = 1;
      return new Temperament(Clifford, new Clifford(scalar), subgroup);
    }
    const promotedVals = vals.map(val => {
      const vector = Array(algebraSize).fill(0);
      vector.splice(1, subgroup.length, ...subgroup.map(index => val[index]));
      return new Clifford(vector);
    });
    return new Temperament(
      Clifford,
      promotedVals.reduce((a, b) => Clifford.Wedge(a, b)),
      subgroup
    );
  }

  static fromCommaList(commas: Comma[], subgroup_?: Subgroup) {
    const subgroup =
      subgroup_ === undefined ? inferSubgroup(commas) : subgroup_;

    const Clifford = Algebra(subgroup.length);
    const algebraSize = 1 << subgroup.length;

    const pseudoScalar_ = Array(algebraSize).fill(0);
    pseudoScalar_[algebraSize - 1] = 1;
    const pseudoScalar = new Clifford(pseudoScalar_);
    if (!commas.length) {
      return new Temperament(Clifford, pseudoScalar, subgroup);
    }

    const promotedCommas = commas.map(comma => {
      const vector = Array(algebraSize).fill(0);
      vector.splice(1, subgroup.length, ...subgroup.map(index => comma[index]));
      return new Clifford(vector).Mul(pseudoScalar);
    });
    return new Temperament(
      Clifford,
      promotedCommas.reduce((a, b) => Clifford.Vee(a, b)),
      subgroup
    );
  }

  static recoverRank2(wedgiePrefix: number[], subgroup: Subgroup) {
    const Clifford = Algebra(subgroup.length);
    const algebraSize = 1 << subgroup.length;

    const jip1 = new Clifford(Array(algebraSize).fill(0));
    subgroup.forEach(
      (index, i) => (jip1[1 + i] = LOG_PRIMES[index] / LOG_PRIMES[subgroup[0]])
    );

    const vector = Array(algebraSize).fill(0);
    vector.splice(2, wedgiePrefix.length, ...wedgiePrefix);
    const value = new Clifford(vector).Wedge(jip1);
    for (let i = 0; i < algebraSize; ++i) {
      value[i] = Math.round(value[i]);
    }
    return new Temperament(Clifford, value, subgroup);
  }
}
