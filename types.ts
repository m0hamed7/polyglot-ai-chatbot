
export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface BusinessInfo {
  name: string;
  industry: string;
  location: string;
  overview: string;
  role: string;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
}
