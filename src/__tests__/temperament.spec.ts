import {describe, it, expect} from 'vitest';
import Fraction from 'fraction.js';

import {dot, fractionToMonzoAndResidual, fractionToMonzo} from '../monzo';
import {
  inverseLogMetric,
  Temperament,
  natsToCents,
  patentVal,
  fromWarts,
  SubgroupTemperament,
  toWarts,
} from '../temperament';
import {LOG_PRIMES} from '../constants';
import {arraysEqual, mmod} from '../utils';

describe('Temperament', () => {
  it('calculates meantone from vals', () => {
    const subgroup = [0, 1, 2];
    const metric = inverseLogMetric(subgroup);
    const edo12 = [12, 19, 28];
    const edo19 = [19, 30, 44];
    const temperament = Temperament.fromValList([edo12, edo19], subgroup);
    const meantone = temperament.toPOTE(metric);

    const syntonicComma = fractionToMonzoAndResidual(
      new Fraction(81, 80),
      3
    )[0];
    const fifth = fractionToMonzoAndResidual(new Fraction(3, 2), 3)[0];
    const octave = [1, 0, 0];

    expect(dot(meantone, syntonicComma)).toBeCloseTo(0);
    expect(dot(meantone, octave)).toBeCloseTo(Math.LN2);
    expect(natsToCents(dot(meantone, fifth))).toBeCloseTo(696.239);
  });

  it('calculates meantone from commas', () => {
    const subgroup = [0, 1, 2];
    const metric = inverseLogMetric(subgroup);
    const syntonicComma = fractionToMonzo(new Fraction(81, 80));
    const temperament = Temperament.fromCommaList([syntonicComma], subgroup);
    const meantone = temperament.toPOTE(metric);

    const fifth = fractionToMonzoAndResidual(new Fraction(3, 2), 3)[0];
    const octave = [1, 0, 0];

    expect(dot(meantone, syntonicComma)).toBeCloseTo(0);
    expect(dot(meantone, octave)).toBeCloseTo(Math.LN2);
    expect(natsToCents(dot(meantone, fifth))).toBeCloseTo(696.239);
  });

  it('reduces to the trivial temperament when given no vals', () => {
    const subgroup = [0, 1, 2];
    const temperament = Temperament.fromValList([], subgroup);
    const trivial = temperament.toTenneyEuclid();
    const octave = [1, 0, 0];
    const tritave = [0, 1, 0];
    const pentave = [0, 0, 1];

    // I would've expected rank 0 temperament to map everything to unity...
    // expect(dot(trivial, octave)).toBe(0);
    // expect(dot(trivial, tritave)).toBe(0);
    // expect(dot(trivial, pentave)).toBe(0);

    // ...but instead it produces just intonation.
    expect(dot(trivial, octave)).toBeCloseTo(Math.LN2);
    expect(dot(trivial, tritave)).toBeCloseTo(Math.log(3));
    expect(dot(trivial, pentave)).toBeCloseTo(Math.log(5));
  });

  it('reduces to just intonation when given no commas', () => {
    const subgroup = [0, 1, 2];
    const temperament = Temperament.fromCommaList([], subgroup);
    const justIntonation = temperament.toTenneyEuclid();
    const octave = [1, 0, 0];
    const tritave = [0, 1, 0];
    const pentave = [0, 0, 1];

    expect(dot(justIntonation, octave)).toBeCloseTo(Math.LN2);
    expect(dot(justIntonation, tritave)).toBeCloseTo(Math.log(3));
    expect(dot(justIntonation, pentave)).toBeCloseTo(Math.log(5));
  });

  it('calculates miracle from commas', () => {
    const subgroup = [0, 1, 2, 3];
    const marvelComma = fractionToMonzo(new Fraction(225, 224));
    const gamelisma = fractionToMonzo(new Fraction(1029, 1024));
    const temperament = Temperament.fromCommaList(
      [marvelComma, gamelisma],
      subgroup
    );
    const miracle = temperament.toPOTE();

    const largeSecor = fractionToMonzo(new Fraction(15, 14));
    const smallSecor = fractionToMonzoAndResidual(new Fraction(16, 15), 4)[0];
    const octave = [1, 0, 0, 0];

    expect(dot(miracle, marvelComma)).toBeCloseTo(0);
    expect(dot(miracle, gamelisma)).toBeCloseTo(0);
    expect(dot(miracle, octave)).toBeCloseTo(Math.LN2);
    expect(natsToCents(dot(miracle, smallSecor))).toBeCloseTo(116.675);
    expect(natsToCents(dot(miracle, largeSecor))).toBeCloseTo(116.675);
  });

  it('calculates miracle from vals', () => {
    const edo10 = patentVal(10, 2, 4);
    const edo21 = patentVal(21, 2, 4);
    const temperament = Temperament.fromValList([edo10, edo21]);
    const miracle = temperament.toPOTE();

    const marvelComma = fractionToMonzo(new Fraction(225, 224));
    const gamelisma = fractionToMonzo(new Fraction(1029, 1024));
    const largeSecor = fractionToMonzo(new Fraction(15, 14));
    const smallSecor = fractionToMonzoAndResidual(new Fraction(16, 15), 4)[0];
    const octave = [1, 0, 0, 0];

    expect(dot(miracle, marvelComma)).toBeCloseTo(0);
    expect(dot(miracle, gamelisma)).toBeCloseTo(0);
    expect(dot(miracle, octave)).toBeCloseTo(Math.LN2);
    expect(natsToCents(dot(miracle, smallSecor))).toBeCloseTo(116.675);
    expect(natsToCents(dot(miracle, largeSecor))).toBeCloseTo(116.675);
  });

  it('calculates orgone from commas', () => {
    const subgroup = [0, 3, 4];
    const orgonisma = fractionToMonzo(new Fraction(65536, 65219));
    const temperament = Temperament.fromCommaList([orgonisma], subgroup);
    const orgone = temperament.toPOTE();
    const smitone = fractionToMonzo(new Fraction(77, 64));
    const octave = [1, 0, 0, 0, 0];

    expect(dot(orgone, orgonisma)).toBeCloseTo(0);
    expect(dot(orgone, octave)).toBeCloseTo(Math.LN2);
    expect(natsToCents(dot(orgone, smitone))).toBeCloseTo(323.372);
  });

  it('calculates orgone from vals', () => {
    const subgroup = [0, 3, 4];
    const edo11 = patentVal(11, 2, 5);
    const edo18 = patentVal(18, 2, 5);
    const temperament = Temperament.fromValList([edo11, edo18], subgroup);
    const orgone = temperament.toPOTE();
    const orgonisma = fractionToMonzo(new Fraction(65536, 65219));
    const smitone = fractionToMonzo(new Fraction(77, 64));
    const octave = [1, 0, 0, 0, 0];

    expect(dot(edo11, orgonisma)).toBe(0);
    expect(dot(edo18, orgonisma)).toBe(0);
    expect(dot(orgone, orgonisma)).toBeCloseTo(0);
    expect(dot(orgone, octave)).toBeCloseTo(Math.LN2);
    expect(natsToCents(dot(orgone, smitone))).toBeCloseTo(323.372);
  });

  it('calculates blackwood in the 2.3 subgroup', () => {
    const limma = fractionToMonzo(new Fraction(256, 243));
    const temperament = Temperament.fromCommaList([limma]);
    const blackwood = temperament.toPOTE();
    const fifth = fractionToMonzo(new Fraction(3, 2));

    expect(blackwood.length).toBe(2);
    expect(dot(blackwood, fifth)).toBeCloseTo((3 * Math.LN2) / 5);
  });

  it('calculates blackwood in the 2.3.5 subgroup', () => {
    const subgroup = [0, 1, 2];
    const limma = fractionToMonzoAndResidual(new Fraction(256, 243), 3)[0];
    const temperament = Temperament.fromCommaList([limma], subgroup);
    const blackwood = temperament.toPOTE();
    const majorThird = fractionToMonzo(new Fraction(5, 4));
    const fifth = [-1, 1, 0];

    expect(blackwood.length).toBe(3);
    expect(dot(blackwood, fifth)).toBeCloseTo((3 * Math.LN2) / 5);
    expect(natsToCents(dot(blackwood, majorThird))).toBeCloseTo(399.594);
  });

  it('calculates arcturus in the 3.5.7 subgroup', () => {
    const comma = fractionToMonzo(new Fraction(15625, 15309));
    const temperament = Temperament.fromCommaList([comma]);
    const arcturus = temperament.toPOTE();
    const majorSixth = fractionToMonzoAndResidual(new Fraction(5, 3), 4)[0];

    expect(arcturus.length).toBe(4);
    expect(natsToCents(dot(arcturus, majorSixth))).toBeCloseTo(878.042);
  });

  it('calculates starling rank 3 from a comma', () => {
    const comma = fractionToMonzo(new Fraction(126, 125));
    const temperament = Temperament.fromCommaList([comma]);
    const starling = temperament.toTenneyEuclid();
    const septimalQuarterTone = fractionToMonzo(new Fraction(36, 35));
    const jubilisma = fractionToMonzo(new Fraction(50, 49));
    const octave = [1, 0, 0, 0];

    expect(starling.length).toBe(4);
    expect(dot(starling, septimalQuarterTone)).toBeCloseTo(
      dot(starling, jubilisma)
    );
    expect(natsToCents(dot(starling, octave))).toBeGreaterThan(1199);
    expect(natsToCents(dot(starling, octave))).toBeLessThan(1200);
  });

  it('calculates starling rank 3 from a list of vals', () => {
    const edo12 = patentVal(12, 2, 4);
    const edo27 = patentVal(27, 2, 4);
    const edo31 = patentVal(31, 2, 4);
    const temperament = Temperament.fromValList([edo12, edo27, edo31]);
    const starling = temperament.toTenneyEuclid();
    const comma = fractionToMonzo(new Fraction(126, 125));
    const octave = [1, 0, 0, 0];

    expect(starling.length).toBe(4);
    expect(dot(starling, comma)).toBeCloseTo(0);
    expect(natsToCents(dot(starling, octave))).toBeGreaterThan(1199);
    expect(natsToCents(dot(starling, octave))).toBeLessThan(1200);
    expect(dot(edo12, comma)).toBe(0);
    expect(dot(edo27, comma)).toBe(0);
    expect(dot(edo31, comma)).toBe(0);
  });

  it('calculates marvel rank 3 from a comma', () => {
    const comma = fractionToMonzo(new Fraction(225, 224));
    const temperament = Temperament.fromCommaList([comma]);
    const marvel = temperament.toPOTE();
    const fifth = fractionToMonzoAndResidual(new Fraction(3, 2), 4)[0];
    const majorThird = fractionToMonzoAndResidual(new Fraction(5, 4), 4)[0];

    expect(marvel.length).toBe(4);
    expect(natsToCents(dot(marvel, fifth))).toBeCloseTo(700.4075);
    expect(natsToCents(dot(marvel, majorThird))).toBeCloseTo(383.6376);
  });

  it('calculates keenanismic rank 4 from a comma', () => {
    const keenanisma = fractionToMonzo(new Fraction(385, 384));
    const temperament = Temperament.fromCommaList([keenanisma]);
    const keenanismic = temperament.toPOTE();

    expect(keenanismic.length).toBe(5);
    expect(dot(keenanismic, keenanisma)).toBeCloseTo(0);
  });

  it('calculates keenanismic rank 4 from a list of vals', () => {
    const edo9 = patentVal(9, 2, 5);
    const edo10 = patentVal(10, 2, 5);
    const edo12e = fromWarts('12e', 5);
    const edo15 = patentVal(15, 2, 5);
    const temperament = Temperament.fromValList([edo9, edo10, edo12e, edo15]);
    const keenanismic = temperament.toPOTE();

    const keenanisma = fractionToMonzo(new Fraction(385, 384));
    expect(keenanismic.length).toBe(5);
    expect(dot(keenanismic, keenanisma)).toBeCloseTo(0);
  });

  it('has a consistent internal representation for the same temperament in 3D', () => {
    const subgroup = [0, 1, 2];
    const edo12 = patentVal(12, 2, 3);
    const edo19 = patentVal(19, 2, 3);
    const edo31 = patentVal(31, 2, 3);
    const syntonicComma = fractionToMonzo(new Fraction(81, 80));

    const twelveAndNineteen = Temperament.fromValList([edo12, edo19], subgroup);
    const twelveAndThirtyOne = Temperament.fromValList(
      [edo12, edo31],
      subgroup
    );
    const nineteenAndThirtyOne = Temperament.fromValList(
      [edo19, edo31],
      subgroup
    );
    const meantone = Temperament.fromCommaList([syntonicComma], subgroup);

    for (let i = 0; i < 2 ** 3; ++i) {
      expect(meantone.value[i]).toBe(Math.floor(meantone.value[i]));
      expect(twelveAndNineteen.value[i]).toBe(meantone.value[i]);
      expect(twelveAndThirtyOne.value[i]).toBe(meantone.value[i]);
      expect(nineteenAndThirtyOne.value[i]).toBeCloseTo(-meantone.value[i]);
    }
  });

  it('has a consistent internal representation for the same temperament in 4D', () => {
    const subgroup = [0, 1, 2, 3];
    const edo9 = patentVal(9, 2, 4);
    const edo10 = patentVal(10, 2, 4);
    const edo12 = patentVal(12, 2, 4);
    const comma = fractionToMonzo(new Fraction(225, 224));

    const nineAndTenAndTwelve = Temperament.fromValList(
      [edo9, edo10, edo12],
      subgroup
    );
    const marvel = Temperament.fromCommaList([comma], subgroup);

    for (let i = 0; i < 2 ** 4; ++i) {
      expect(marvel.value[i]).toBe(Math.floor(marvel.value[i]));
      expect(nineAndTenAndTwelve.value[i]).toBe(marvel.value[i]);
    }
  });

  it('has a consistent internal representation for the same temperament in 4D with a 3D comma', () => {
    const subgroup = [0, 1, 2, 3];
    const edo10 = patentVal(10, 2, 4);
    const edo12 = patentVal(12, 2, 4);
    const edo46 = patentVal(46, 2, 4);
    const diaschisma = fractionToMonzoAndResidual(
      new Fraction(2048, 2025),
      4
    )[0];

    const tenAndTwelveAndFortySix = Temperament.fromValList(
      [edo10, edo12, edo46],
      subgroup
    );
    const diaschismic = Temperament.fromCommaList([diaschisma], subgroup);

    for (let i = 0; i < 2 ** 4; ++i) {
      expect(diaschismic.value[i]).toBe(Math.floor(diaschismic.value[i]));
      expect(tenAndTwelveAndFortySix.value[i]).toBeCloseTo(
        -diaschismic.value[i]
      );
    }
  });

  it('can figure out the period and a generator for meantone', () => {
    const syntonicComma = fractionToMonzo(new Fraction(81, 80));
    const temperament = Temperament.fromCommaList([syntonicComma]);
    const [divisions, generator] = temperament.divisionsGenerator();

    expect(divisions).toBe(1);
    expect(generator.length).toBe(3);

    const meantone = temperament.toPOTE();
    const poteGenerator = 696.239;

    // XXX: This is technically not the correct check. 1200 - poteGenerator is also valid.
    expect(natsToCents(dot(meantone, generator)) % 1200).toBeCloseTo(
      poteGenerator
    );
  });

  it('can figure out the period and a generator for orgone', () => {
    const orgonisma = fractionToMonzo(new Fraction(65536, 65219));
    const temperament = Temperament.fromCommaList([orgonisma]);
    const [divisions, generator] = temperament.divisionsGenerator();

    expect(divisions).toBe(1);
    expect(generator.length).toBe(5);

    const orgone = temperament.toPOTE();
    const poteGenerator = 323.372;

    // XXX: See?
    expect(natsToCents(dot(orgone, generator)) % 1200).toBeCloseTo(
      1200 - poteGenerator
    );
  });

  it('can figure out the period and a generator for blackwood', () => {
    const limma = fractionToMonzoAndResidual(new Fraction(256, 243), 3)[0];
    const subgroup = [0, 1, 2];
    const temperament = Temperament.fromCommaList([limma], subgroup);
    const [divisions, generator] = temperament.divisionsGenerator();

    expect(divisions).toBe(5);
    expect(generator.length).toBe(3);

    const blackwood = temperament.toPOTE();
    const poteGenerator = 399.594;
    expect(natsToCents(dot(blackwood, generator)) % 240).toBeCloseTo(
      poteGenerator % 240
    );
  });

  it('can figure out the period and a generator for augmented', () => {
    const diesis = fractionToMonzo(new Fraction(128, 125));
    const subgroup = [0, 1, 2];
    const temperament = Temperament.fromCommaList([diesis], subgroup);
    const [divisions, generator] = temperament.divisionsGenerator();

    expect(divisions).toBe(3);
    expect(generator.length).toBe(3);

    const augmented = temperament.toPOTE();
    const poteGenerator = 706.638;
    expect(natsToCents(dot(augmented, generator)) % 400).toBeCloseTo(
      poteGenerator % 400
    );
  });

  it('can figure out the period and a generator for miracle', () => {
    const marvelComma = fractionToMonzo(new Fraction(225, 224));
    const gamelisma = fractionToMonzo(new Fraction(1029, 1024));
    const temperament = Temperament.fromCommaList([marvelComma, gamelisma]);
    const [divisions, generator] = temperament.divisionsGenerator();

    expect(divisions).toBe(1);
    expect(generator.length).toBe(4);

    const miracle = temperament.toPOTE();
    const poteGenerator = 116.675;

    expect(natsToCents(dot(miracle, generator)) % 1200).toBeCloseTo(
      1200 - poteGenerator
    );
  });

  it('can recover semaphore from its prefix', () => {
    const diesis = fractionToMonzo(new Fraction(49, 48));
    const temperament = Temperament.fromCommaList([diesis]);
    temperament.canonize();
    expect(temperament.subgroup.length).toBe(3);
    const subgroup = [0, 1, 3];
    const prefix = temperament.rankPrefix(2);
    expect(prefix.length).toBe(2);
    expect(prefix[0]).toBe(2);
    expect(prefix[1]).toBe(1);
    const recovered = Temperament.fromPrefix(2, prefix, subgroup);
    recovered.canonize();
    expect(temperament.equals(recovered)).toBeTruthy();
  });

  it('can recover miracle from its prefix', () => {
    const marvelComma = fractionToMonzo(new Fraction(225, 224));
    const gamelisma = fractionToMonzo(new Fraction(1029, 1024));
    const temperament = Temperament.fromCommaList([marvelComma, gamelisma]);
    temperament.canonize();
    expect(temperament.subgroup.length).toBe(4);
    const prefix = temperament.rankPrefix(2);
    expect(prefix.length).toBe(3);
    expect(prefix[0]).toBe(6);
    expect(prefix[1]).toBe(-7);
    expect(prefix[2]).toBe(-2);
    const recovered = Temperament.fromPrefix(2, prefix, temperament.subgroup);
    recovered.canonize();
    expect(temperament.equals(recovered)).toBeTruthy();
  });

  it('can recover augmented from its prefix', () => {
    const diesis = fractionToMonzo(new Fraction(128, 125));
    const subgroup = [0, 1, 2];
    const temperament = Temperament.fromCommaList([diesis], subgroup);
    temperament.canonize();
    expect(temperament.subgroup.length).toBe(3);
    const prefix = temperament.rankPrefix(2);
    expect(prefix.length).toBe(2);
    expect(prefix[0]).toBe(3);
    expect(prefix[1]).toBe(0);
    const recovered = Temperament.fromPrefix(2, prefix, subgroup);
    recovered.canonize();
    expect(temperament.equals(recovered)).toBeTruthy();
  });

  it('calculates marvel rank 3 from its prefix', () => {
    const comma = fractionToMonzo(new Fraction(225, 224));
    const temperament = Temperament.fromCommaList([comma]);
    temperament.canonize();
    const prefix = temperament.rankPrefix(3);
    const recovered = Temperament.fromPrefix(3, prefix, temperament.subgroup);
    recovered.canonize();
    expect(temperament.equals(recovered)).toBeTruthy();
  });
});

describe('Fractional Subgroup Temperament', () => {
  it('calculates meantone from vals', () => {
    const jip = LOG_PRIMES.slice(0, 3);
    const edo12 = [12, 19, 28];
    const edo19 = [19, 30, 44];
    const temperament = SubgroupTemperament.fromValList([edo12, edo19], jip);
    const meantone = temperament.toPOTE();

    const syntonicComma = fractionToMonzo(new Fraction(81, 80));
    const fifth = fractionToMonzoAndResidual(new Fraction(3, 2), 3)[0];
    const octave = [1, 0, 0];

    expect(dot(meantone, syntonicComma)).toBeCloseTo(0);
    expect(dot(meantone, octave)).toBeCloseTo(Math.LN2);
    expect(natsToCents(dot(meantone, fifth))).toBeCloseTo(696.239);
  });

  it('can handle a fractional JI subgroup such as 2.3.13/5 (barbados)', () => {
    const monzo = fractionToMonzo(new Fraction(676, 675));
    const islandComma = [monzo[0], monzo[1], monzo[5]];
    const jip = [Math.LN2, LOG_PRIMES[1], LOG_PRIMES[5] - LOG_PRIMES[2]];
    const temperament = SubgroupTemperament.fromCommaList([islandComma], jip);

    const barbados = temperament.toPOTE();

    const [d, g] = temperament.divisionsGenerator();

    temperament.canonize();
    const prefix = temperament.rankPrefix(2);
    const recovered = SubgroupTemperament.fromPrefix(2, prefix, jip);
    recovered.canonize();

    const genMonzo = fractionToMonzo(new Fraction(15, 13));
    const semifourth = [genMonzo[0], genMonzo[1], genMonzo[5]];
    const octave = [1, 0, 0];

    expect(d).toBe(1);
    expect(dot(barbados, islandComma)).toBeCloseTo(0);
    expect(dot(barbados, octave)).toBeCloseTo(Math.LN2);
    expect(natsToCents(dot(barbados, semifourth))).toBeCloseTo(248.621);
    expect(mmod(natsToCents(dot(barbados, g)), 1200)).toBeCloseTo(
      1200 - 248.621
    );
    expect(temperament.equals(recovered)).toBeTruthy();
  });

  it('can handle a fractional non-orthogonal JI subgroup such as 2.3.13/5.19/5 (pinkan)', () => {
    const islandComma_ = fractionToMonzo(new Fraction(676, 675));
    const password_ = fractionToMonzo(new Fraction(1216, 1215));
    const islandComma = [islandComma_[0], islandComma_[1], islandComma_[5], 0];
    const password = [password_[0], password_[1], password_[5], password_[7]];
    const jip = [
      Math.LN2,
      LOG_PRIMES[1],
      LOG_PRIMES[5] - LOG_PRIMES[2],
      LOG_PRIMES[7] - LOG_PRIMES[2],
    ];
    const temperament = SubgroupTemperament.fromCommaList(
      [islandComma, password],
      jip
    );
    const pinkan = temperament.toPOTE();

    const [d, g] = temperament.divisionsGenerator();

    const semifourth_ = fractionToMonzo(new Fraction(15, 13));
    const semifourth = [semifourth_[0], semifourth_[1], semifourth_[5], 0];
    const octave = [1, 0, 0, 0];

    expect(d).toBe(1);
    expect(dot(pinkan, islandComma)).toBeCloseTo(0);
    expect(dot(pinkan, password)).toBeCloseTo(0);
    expect(dot(pinkan, octave)).toBeCloseTo(Math.LN2);
    expect(natsToCents(dot(pinkan, semifourth))).toBeCloseTo(248.868);
    expect(mmod(natsToCents(dot(pinkan, g)), 1200)).toBeCloseTo(1200 - 248.868);
  });
});

describe('Val to wart converter', () => {
  it('converts <12 19 28]', () => {
    expect(toWarts([12, 19, 28])).toBe('12');
  });
  it('converts <12 20 28]', () => {
    expect(toWarts([12, 20, 28])).toBe('12b');
  });
  it('converts <12 18 28]', () => {
    expect(toWarts([12, 18, 28])).toBe('12bb');
  });
  it('converts <12 19 27]', () => {
    expect(toWarts([12, 19, 27])).toBe('12c');
  });
  it('converts <12 19 26]', () => {
    expect(toWarts([12, 19, 26])).toBe('12ccc');
  });
  it('it is compatible with wart to val converter', () => {
    for (let n = 0; n < 10; ++n) {
      let token = Math.round(1 + 100 * Math.random()).toString();
      for (let i = 1; i < 4; ++i) {
        for (let j = 0; j < Math.floor(5 * Math.random()); ++j) {
          token += String.fromCharCode(97 + i);
        }
      }
      expect(toWarts(fromWarts(token, 4))).toBe(token);
    }
  });
});

describe('Wart to val converter', () => {
  it('converts 12', () => {
    expect(arraysEqual(fromWarts('12', 3), [12, 19, 28])).toBeTruthy();
  });
  it('converts 12b', () => {
    expect(arraysEqual(fromWarts('12b', 3), [12, 20, 28])).toBeTruthy();
  });
  it('converts 12bb', () => {
    expect(arraysEqual(fromWarts('12bb', 3), [12, 18, 28])).toBeTruthy();
  });
  it('converts 12c', () => {
    expect(arraysEqual(fromWarts('12c', 3), [12, 19, 27])).toBeTruthy();
  });
  it('converts 12ccc', () => {
    expect(arraysEqual(fromWarts('12ccc', 3), [12, 19, 26])).toBeTruthy();
  });
});
