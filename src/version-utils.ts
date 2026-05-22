import { ConstraintOperator, VersionConstraint } from './types';

export class VersionUtils {
  /**
   * Parses a version string into major, minor, patch.
   * Format: major.minor.patch
   */
  static parse(version: string): { major: number; minor: number; patch: number } {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    };
  }

  /**
   * Compares two version strings.
   * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if v1 == v2.
   */
  static compare(v1: string, v2: string): number {
    const p1 = this.parse(v1);
    const p2 = this.parse(v2);

    if (p1.major !== p2.major) return p1.major > p2.major ? 1 : -1;
    if (p1.minor !== p2.minor) return p1.minor > p2.minor ? 1 : -1;
    if (p1.patch !== p2.patch) return p1.patch > p2.patch ? 1 : -1;
    return 0;
  }

  /**
   * Parses a constraint string like "^1.2.3" or ">=2.0.0".
   */
  static parseConstraint(constraint: string): VersionConstraint {
    const regex = /^([>=<~^]*)\s*(.*)$/;
    const match = constraint.match(regex);

    if (!match) {
      throw new Error(`Invalid constraint format: ${constraint}`);
    }

    const opStr = match[1] || '=';
    const version = match[2];

    let operator: ConstraintOperator;
    switch (opStr) {
      case '^': operator = ConstraintOperator.CARET; break;
      case '~': operator = ConstraintOperator.TILDE; break;
      case '>=': operator = ConstraintOperator.GTE; break;
      case '>': operator = ConstraintOperator.GT; break;
      case '<=': operator = ConstraintOperator.LTE; break;
      case '<': operator = ConstraintOperator.LT; break;
      case '=':
      case '': operator = ConstraintOperator.EQ; break;
      default: throw new Error(`Unsupported operator: ${opStr}`);
    }

    return { operator, version };
  }

  /**
   * Checks if a version satisfies a constraint.
   */
  static satisfies(version: string, constraintStr: string): boolean {
    const { operator, version: targetVersion } = this.parseConstraint(constraintStr);
    const comparison = this.compare(version, targetVersion);

    switch (operator) {
      case ConstraintOperator.EQ:
        return comparison === 0;
      case ConstraintOperator.GT:
        return comparison > 0;
      case ConstraintOperator.GTE:
        return comparison >= 0;
      case ConstraintOperator.LT:
        return comparison < 0;
      case ConstraintOperator.LTE:
        return comparison <= 0;
      case ConstraintOperator.CARET: {
        const pV = this.parse(version);
        const pT = this.parse(targetVersion);
        if (pT.major !== 0) {
          return pV.major === pT.major && comparison >= 0;
        } else if (pT.minor !== 0) {
          return pV.major === 0 && pV.minor === pT.minor && comparison >= 0;
        } else {
          return comparison === 0;
        }
      }
      case ConstraintOperator.TILDE: {
        const pV = this.parse(version);
        const pT = this.parse(targetVersion);
        return pV.major === pT.major && pV.minor === pT.minor && comparison >= 0;
      }
      default:
        return false;
    }
  }

  /**
   * Sorts versions in descending order.
   */
  static sort(versions: string[]): string[] {
    return [...versions].sort((a, b) => this.compare(b, a));
  }
}
