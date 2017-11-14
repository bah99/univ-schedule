import { ScheduleClass } from "./scheduleClass";
import * as moment from 'moment';
import { Config } from "../config";
const parseHTML = require('nativescript-xml2js').parseString;
const extractScheduleRegex = new RegExp('<ul data-role="listview" data-theme="d" data-divider-theme="b">[^]*</ul>');
const extractDateRegex = new RegExp('<h1>([^]* \\d{1,2} [^]*)</h1>');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

export class ScheduleDay{
    date: string;
    //date this object was created/updated from the website
    cacheDate: string;
    classes: Array<ScheduleClass> = [];

    buildFromHTML(html: string): Promise<any>{
        return new Promise((resolve, reject) => {

            let cleanHTML = extractScheduleRegex.exec(html);
            if(!cleanHTML){
                Config.jsessionid = "";
                return reject("J'ai tout cassé! Rafraichit la page stp");
            }
            parseHTML(cleanHTML.toString(), (err, result) => {
                if(err)
                    return reject(err);
                try{
                    let day = extractDateRegex.exec(html);
                    this.date = entities.decode(day[1].toString());

                    this.populateClassesWithParsedHTML(result);
                    this.updateCacheDate();
                    resolve(this);            
                }catch(ex){
                    return reject(ex);
                }
            });
        });
    }

    private populateClassesWithParsedHTML(parsedHTML){
        this.classes = [];
        //if the day is empty 
        if(!parsedHTML.ul.li) 
            return;

        let list = parsedHTML.ul.li;
        for(let i = 0; i < list.length; i += 2){
            let header = list[i];
            let content = list[i+1];

            let classe = new ScheduleClass();
            classe.name = header._;
            classe.type = header.span[0]._;
            classe.room = content.h3[0].trim();
            if(content.p[1]._)
                classe.extraInfo = content.p[1]._;
            classe.speaker = content.p[0].strong[0].trim();
            let time = content.p[2].strong[0].trim();
            time = time.split('-');
            classe.timeStart = time[0];
            classe.timeEnd = time[1];
            
            this.classes.push(classe);
        }
    }

    updateCacheDate(){
        this.cacheDate = moment().format("DD/MM/YYYY");
    }

    id(): string{
        return ScheduleDay.formatDate(this.date);
    }

    dateMoment(): moment.Moment{
        return moment(this.date, "DD MMM", 'fr');
    }

    static formatDate(date: string): string{
        let mom = moment(date, "DD MMM", 'fr');
        return ScheduleDay.formatMoment(mom);
    }

    static formatMoment(mom: moment.Moment): string{
        return mom.format("DD/MM");
    }
}