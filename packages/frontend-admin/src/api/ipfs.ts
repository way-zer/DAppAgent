import axios from 'axios';
import {useService} from '@dapp-agent/sdk';

export async function status() {
  return useService("system").status();
}
