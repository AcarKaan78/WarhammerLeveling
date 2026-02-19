import { substituteVariables } from '@/domain/engine/narrative-engine';

export class VariableSubstituteUseCase {
  execute(text: string, variables: Record<string, string | number>): string {
    const stringVars: Record<string, string> = {};
    for (const [key, value] of Object.entries(variables)) {
      stringVars[key] = String(value);
    }
    return substituteVariables(text, stringVars);
  }
}
