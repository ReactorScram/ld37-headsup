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

func verify_user (db *sql.DB, password string) *string {
	stmt, _ := db.Prepare("select nick from Passwords where password == ? limit 1;")
	defer stmt.Close ()
	row := stmt.QueryRow (password)
	var nick *string = nil
	row.Scan (nick)
	return nick
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
			fmt.Fprintf (w, "%d users total\n", count)
		} else {
			fmt.Fprintf(w, "500 Internal Server Error")
			return
		}
	})
	
	http.HandleFunc("/submit_suggestion", func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		
		given_password := get_query_arg (query, "password")
		
		if given_password == nil {
			fmt.Fprintf(w, "<form ><input type='text'>")
			return
		}
		
		nick := verify_user (db, *given_password)
		
		if nick == nil {
			fmt.Fprintf(w, "500 Internal Server Error")
			return
		} else {
			author, category, suggestion := get_query_arg (query, "author"), get_query_arg (query, "category"), get_query_arg (query, "suggestion")
			
			if author != nil && category != nil && suggestion != nil {
				{
					stmt, _ := db.Prepare ("insert into Suggestions (password, author, category, suggestion) values (?, ?, ?, ?);")
					defer stmt.Close ()
					
					stmt.Exec (given_password, author, category, suggestion)
				}
				{
					stmt, _ := db.Prepare ("select count () from Suggestions where password == ?;")
					defer stmt.Close ()
					
					row := stmt.QueryRow (given_password)
					count := 0
					row.Scan (&count)
					
					fmt.Fprintf (w, "Success. You have submitted %d suggestions.\n", count)
				}
			}
		}
	})
	
	db.Exec("create table if not exists Passwords (nick string unique, password string);")
	db.Exec("create table if not exists Suggestions (password string, author string, category string, suggestion string);")
	db.Exec ("create index if not exists SuggestionsByPassword on Suggestions (password);")
	
	// Start server
	log.Fatal(http.ListenAndServe(":8080", nil))
}
