import { Queue } from "bullmq";
import {redisConnection} from "../../config/redis.js"


export const notificationQueue = new Queue("notification" , {
    connection : redisConnection ,
    defaultJobOptions : {
        attempts : 4 , 
        backoff : {
            type : "exponential" ,
            delay : 5000
        },
        removeOnComplete : true ,
        removeOnFail : 100
    }
})

