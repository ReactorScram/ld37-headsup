package main

// Stdlib

import (
	"database/sql"
	"fmt"
	_ "html"
	"log"
	"net/http"
	"os"
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

func count_users (db *sql.DB) int {
	row := db.QueryRow("select count () from Passwords;")
	count := 0
	row.Scan(&count)
	return count
}

func main() {
	master_password := os.Args[1]
	
	// Open DB
	db, err := sql.Open("sqlite3", "./ld37-server.sqlite")
	if err != nil {
		log.Fatal(err)
	}
	
	// Register handlers
	http.HandleFunc("/count_users", func(w http.ResponseWriter, r *http.Request) {
		count := count_users (db)
		
		fmt.Fprintf(w, "User count: %d\n", count)
	})
	
	http.HandleFunc("/set_password", func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		
		given_password := get_query_arg(query, "master_password")
		if given_password != nil && *given_password == master_password {
			password := get_query_arg(query, "password")
			nick := get_query_arg(query, "nick")
			
			if nick == nil || password == nil || *nick == "" || *password == "" {
				fmt.Fprintf(w, "500 Internal Server Error")
				return
			}
			
			stmt, _ := db.Prepare ("insert or replace into Passwords (nick, password) values (?, ?);")
			
			defer stmt.Close ()
			stmt.Exec (nick, password)
			
			count := count_users (db)
			
			fmt.Fprintf (w, "Set password for '%v'\n", *nick)
			fmt.Fprintf (w, "%v users total\n", count)
		} else {
			fmt.Fprintf(w, "500 Internal Server Error")
			return
		}
	})
	
	db.Exec("create table if not exists Passwords (nick string unique, password string);")
	db.Exec("create table if not exists Suggestions (password string, author string, suggestion string);")
	
	// Start server
	log.Fatal(http.ListenAndServe(":8080", nil))
}
