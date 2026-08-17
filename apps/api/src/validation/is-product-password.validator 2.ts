import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
import {
  evaluateProductPasswordPolicy,
  PRODUCT_PASSWORD_POLICY_MESSAGE,
} from '../modules/auth/password-policy';

export function IsProductPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isProductPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return evaluateProductPasswordPolicy(value).ok;
        },
        defaultMessage(args: ValidationArguments) {
          const result = evaluateProductPasswordPolicy(args.value);
          return result.ok ? PRODUCT_PASSWORD_POLICY_MESSAGE : result.message;
        },
      },
    });
  };
}
