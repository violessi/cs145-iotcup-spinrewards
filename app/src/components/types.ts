import { Timestamp } from 'firebase/firestore';

// should match actual fields from database

export type Trip = {
  bike_id: string;
  start_time: Timestamp;
  end_time: Timestamp;
  status: string;
  addtl_charge: number;
  id: string;
  start_rack: string;
  end_rack: string;
};

export type Rack = {
  name: string;
  location: string;
  available: number;
  reserved: number;
  empty: number;
};

export type Reward = {
  id: string;
  desc: string;
  end_rack: string;
  status: string;
  reqs: string[];
  prize: number;
};