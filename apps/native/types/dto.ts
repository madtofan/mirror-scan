export interface ReceiveFirst {
  userId: string;
}

export interface ReceiveSecond {
  message: string;
}

export interface SendFirst {
  sender: string;
  receiver: string;
  amount_sent: number;
  new_balance: number;
  sequence_number: string;
  previous_tx_hash: string;
  signature: string;
}

