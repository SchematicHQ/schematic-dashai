import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreditBalance {
  allocation: number;
  usage: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: string;
  status: string;
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class SchematicApiService {
  private http = inject(HttpClient);

  getAccessToken(): Observable<{ accessToken: string }> {
    return this.http.get<{ accessToken: string }>('/api/accessToken');
  }

  getCreditBalance(): Observable<CreditBalance> {
    return this.http.get<CreditBalance>('/api/credit-balance');
  }

  getUsers(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>('/api/users');
  }

  addUser(user: {
    name: string;
    email: string;
    role: string;
  }): Observable<TeamMember> {
    return this.http.post<TeamMember>('/api/users', user);
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/users?id=${id}`);
  }

  getDataSources(): Observable<DataSource[]> {
    return this.http.get<DataSource[]>('/api/data-sources');
  }

  addDataSource(source: {
    name: string;
    type: string;
    icon: string;
  }): Observable<DataSource> {
    return this.http.post<DataSource>('/api/data-sources', source);
  }

  deleteDataSource(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `/api/data-sources?id=${id}`
    );
  }
}
