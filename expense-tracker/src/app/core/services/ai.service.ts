import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';


@Injectable({
    providedIn: 'root'
})

public class AiService { 
    private apiUrl = environment.apiUrl; 
    constructor(private http: HttpClient) {} 

    chat()
}