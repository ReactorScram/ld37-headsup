package main

// Stdlib

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
)

import _ "github.com/mattn/go-sqlite3"

func get_query_arg(m map[string][]string, key string) *string {
	list := m[key]
	if list == nil {
		return nil
	} else {
		return &list[0]
	}
}

func main() {
	// Open DB
	db, err := sql.Open("sqlite3", "analytics.sqlite")
	if err != nil {
		log.Fatal(err)
	}
	
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		stmt, _ := db.Prepare ("insert into Events (ip, timestamp, json) values (?, strftime ('%s', 'now'), ?);")
		defer stmt.Close ()
		
		body, _ := ioutil.ReadAll (r.Body);
		
		stmt.Exec (r.RemoteAddr, body);
		
		{
			stmt, _ := db.Prepare ("select datetime ('now');")
			defer stmt.Close ()
			
			row := stmt.QueryRow ()
			var timeString = ""
			
			row.Scan (&timeString)
			
			fmt.Println (timeString)
		}
		
		//fmt.Println (r.RemoteAddr);
		
		fmt.Fprintf (w, ":^)\r\n%v\r\n", len (body));
	})
	
	db.Exec ("create table if not exists Events (ip string, timestamp int, json string);")
	
	host := "127.0.0.1:8081"
	
	fmt.Println ("Listening... ", host)
	
	// Start server
	log.Fatal(http.ListenAndServe(host, nil))
}
