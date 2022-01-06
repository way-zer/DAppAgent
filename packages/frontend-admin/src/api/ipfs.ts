import axios from 'axios';
import { useService } from 'sdk'

export async function status() {
  return useService("system").status();
}
