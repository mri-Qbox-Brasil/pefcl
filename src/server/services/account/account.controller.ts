import { Controller } from '../../decorators/Controller';
import { NetPromise, PromiseEventListener } from '../../decorators/NetPromise';
import {
  Account,
  AccountRole,
  AddBankBalanceInput,
  AddToSharedAccountInput,
  ATMInput,
  CreateSharedInput,
  ExternalAccount,
  PreDBAccount,
  RemoveFromSharedAccountInput,
  RenameAccountInput,
  SharedAccountUser,
} from '@typings/Account';
import {
  AccountEvents,
  ExternalAccountEvents,
  SharedAccountEvents,
  UserEvents,
} from '@typings/Events';
import { Request, Response } from '@typings/http';
import { ServerExports } from '@typings/exports/server';
import { AccountService } from './account.service';
import { Event, EventListener } from '@decorators/Event';
import { ExternalAccountService } from '@services/accountExternal/externalAccount.service';
import { AuthService } from '@services/auth/auth.service';
import { Export, ExportListener } from '@decorators/Export';
import { OnlineUser } from '@server/../../typings/user';

@Controller('Account')
@PromiseEventListener()
@EventListener()
@ExportListener()
export class AccountController {
  _auth: AuthService;
  _accountService: AccountService;
  _externalAccountService: ExternalAccountService;

  constructor(
    auth: AuthService,
    accountService: AccountService,
    externalAccountService: ExternalAccountService,
  ) {
    this._auth = auth;
    this._accountService = accountService;
    this._externalAccountService = externalAccountService;
  }

  @Export(ServerExports.GetAccounts)
  @NetPromise(AccountEvents.GetAccounts)
  async getAccounts(req: Request<void>, res: Response<Account[]>) {
    const accounts = await this._accountService.handleGetMyAccounts(req.source);
    res({ status: 'ok', data: accounts });
  }

  @Export(ServerExports.GetTotalBalance)
  async getTotalBankBalance(req: Request<void>, res: Response<number>) {
    const balance = await this._accountService.getTotalBankBalance(req.source);
    res({ status: 'ok', data: balance });
  }

  @NetPromise(AccountEvents.CreateAccount)
  async createAccount(req: Request<PreDBAccount>, res: Response<Account>) {
    try {
      const account = await this._accountService.handleCreateAccount(req);

      res({ status: 'ok', data: account });
    } catch (err) {
      res({ status: 'error', errorMsg: err.message });
    }
  }

  @NetPromise(AccountEvents.DeleteAccount)
  async deleteAccount(req: Request<{ accountId: number }>, res: Response<any>) {
    try {
      await this._auth.isAuthorizedAccount(req.data.accountId, req.source, [AccountRole.Owner]);
      await this._accountService.handleDeleteAccount(req);
      res({ status: 'ok', data: {} });
    } catch (err) {
      res({ status: 'error', errorMsg: err.message });
    }
  }

  @Export(ServerExports.CreateAccount)
  async exportCreateAccount(req: Request<CreateSharedInput>, res: Response<Account>) {
    try {
      const account = await this._accountService.createAccount(req);
      res({ status: 'ok', data: account });
    } catch (err) {
      res({ status: 'error', errorMsg: err.message });
    }
  }

  @Export(ServerExports.DepositMoney)
  @NetPromise(AccountEvents.DepositMoney)
  async depositMoney(req: Request<ATMInput>, res: Response<any>) {
    try {
      await this._accountService.handleDepositMoney(req);
      res({ status: 'ok', data: {} });
    } catch (err) {
      res({ status: 'error', errorMsg: err.message });
    }
  }

  @Export(ServerExports.WithdrawMoney)
  @NetPromise(AccountEvents.WithdrawMoney)
  async withdrawMoney(req: Request<ATMInput>, res: Response<any>) {
    const accountId = req.data.accountId;

    try {
      accountId &&
        (await this._auth.isAuthorizedAccount(accountId, req.source, [AccountRole.Admin]));
      await this._accountService.handleWithdrawMoney(req);
      res({ status: 'ok', data: {} });
    } catch (err) {
      console.error(err);
      res({ status: 'error', errorMsg: err.message });
    }
  }

  @NetPromise(AccountEvents.SetDefaultAccount)
  async setDefaultAccount(req: Request<{ accountId: number }>, res: Response<any>) {
    try {
      await this._auth.isAuthorizedAccount(req.data.accountId, req.source, [AccountRole.Admin]);
      await this._accountService.handleSetDefaultAccount(req);
      res({ status: 'ok', data: {} });
    } catch (err) {
      res({ status: 'error', errorMsg: err.message });
    }
  }

  @NetPromise(AccountEvents.RenameAccount)
  async renameAccount(req: Request<RenameAccountInput>, res: Response<any>) {
    try {
      await this._auth.isAuthorizedAccount(req.data.accountId, req.source, [AccountRole.Admin]);
      await this._accountService.handleRenameAccount(req);
      res({ status: 'ok', data: {} });
    } catch (err) {
      res({ status: 'error', errorMsg: err.message });
    }
  }

  @NetPromise(SharedAccountEvents.AddUser)
  async addSharedAccountUser(req: Request<AddToSharedAccountInput>, res: Response<any>) {
    try {
      await this._auth.isAuthorizedAccount(req.data.accountId, req.source, [AccountRole.Admin]);
      await this._accountService.addUserToShared(req);
      res({ status: 'ok', data: {} });
    } catch (err) {
      res({ status: 'error', errorMsg: err.message });
    }
  }

  @NetPromise(SharedAccountEvents.RemoveUser)
  async removeSharedAccountUser(req: Request<RemoveFromSharedAccountInput>, res: Response<any>) {
    try {
      await this._auth.isAuthorizedAccount(req.data.accountId, req.source, [AccountRole.Admin]);
      await this._accountService.removeUserFromShared(req);
      res({ status: 'ok', data: {} });
    } catch (err) {
      res({ status: 'error', errorMsg: err.message });
    }
  }

  @NetPromise(SharedAccountEvents.GetUsers)
  async getUsersFromSharedAccount(
    req: Request<{ accountId: number }>,
    res: Response<SharedAccountUser[]>,
  ) {
    try {
      await this._auth.isAuthorizedAccount(req.data.accountId, req.source, [
        AccountRole.Admin,
        AccountRole.Contributor,
      ]);
      const data = await this._accountService.getUsersFromShared(req);
      res({ status: 'ok', data: data });
    } catch (err) {
      res({ status: 'error', errorMsg: err.message });
    }
  }

  @NetPromise(ExternalAccountEvents.Add)
  async addExternalAccount(req: Request<ExternalAccount>, res: Response<any>) {
    try {
      await this._externalAccountService.handleAddAccount(req);
      res({ status: 'ok', data: {} });
    } catch (err) {
      res({ status: 'error', errorMsg: err.message });
    }
  }

  @NetPromise(ExternalAccountEvents.Get)
  async getExternalAccounts(req: Request<void>, res: Response<any>) {
    try {
      const data = await this._externalAccountService.getAccounts(req);
      res({ status: 'ok', data });
    } catch (err) {
      res({ status: 'error', errorMsg: err.message, errorName: err.name });
    }
  }

  @Export(ServerExports.AddBankBalance)
  async addBankBalance(req: Request<{ amount: number; message: string }>, res: Response<unknown>) {
    try {
      await this._accountService.addMoney(req);
      res({ status: 'ok', data: {} });
    } catch (err) {
      res({ status: 'error', errorMsg: err.message });
    }
  }

  @Export(ServerExports.AddBankBalanceByIdentifier)
  async addBankBalanceByIdentifier(req: Request<AddBankBalanceInput>, res: Response<unknown>) {
    try {
      await this._accountService.addMoney(req);
      res({ status: 'ok', data: {} });
    } catch (err) {
      res({ status: 'error', errorMsg: err.message });
    }
  }

  @Export(ServerExports.RemoveBankBalance)
  async removeBankBalance(
    req: Request<{ amount: number; message: string }>,
    res: Response<unknown>,
  ) {
    try {
      await this._accountService.removeMoney(req);
      res({ status: 'ok', data: {} });
    } catch (err) {
      res({ status: 'error', errorMsg: err.message });
    }
  }

  /* When starting the resource / new player joining. We should handle the default account. */
  @Event(UserEvents.Loaded)
  async onUserLoaded(user: OnlineUser) {
    const src = user.source;
    this._accountService.createInitialAccount(src);
  }
}
