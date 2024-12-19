import { Stack, Token } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export const regionPrefixMap: { [key: string]: string } = {
  'us': 'us',
  'eu': 'eu',
  'ap': 'apac',
};

export const getCrossRegionModelId = (region: string, modelId: string): string => {
  const prefix = regionPrefixMap[region.substring(0, 2)];
  return `${prefix}.${modelId}`;
};

export const getCurrentRegion = (construct?: Construct): string => {
  const region = (!construct || Token.isUnresolved(Stack.of(construct).region))
    ? (process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION)
    : (construct ? Stack.of(construct).region : undefined);
  if (!region) {
    throw new Error('Current region is not set, cannot add cross-region inference policy.');
  }
  return region;
};