export { PaperAccountModule } from './paper-account.module';
export { PaperAccountService, type CreatePaperAccountCommand } from './paper-account.service';
export {
  activatePaperAccount,
  closePaperAccount,
  createPaperAccount,
  PAPER_ACCOUNT_SCHEMA_VERSION,
  PaperAccountStatus,
  suspendPaperAccount,
  type CreatePaperAccountInput,
  type PaperAccount,
} from './domain/paper-account';
export {
  PAPER_ACCOUNT_REPOSITORY,
  type PaperAccountRepository,
} from './persistence/paper-account.repository';
