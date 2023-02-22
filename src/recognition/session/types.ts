import { Observable, ReplaySubject } from "rxjs";
import { Duplex } from "stream";

export interface Session {
  stream: Duplex;
  textStream: Observable<string>;
  close: () => void;
}
