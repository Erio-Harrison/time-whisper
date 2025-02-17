use std::io;
use std::fmt;
use rusqlite;
use chrono::{DateTime, Utc};
use rusqlite::{Connection, Result};
use tauri::{AppHandle, Manager};
use std::collections::HashMap;
use super::types::{AppUsageRecord, AppUsageStats, DailyUsage};

#[derive(Debug)]
pub enum StorageError {
    Io(io::Error),
    Sqlite(rusqlite::Error),
}

impl From<io::Error> for StorageError {
    fn from(err: io::Error) -> Self {
        StorageError::Io(err)
    }
}

impl From<rusqlite::Error> for StorageError {
    fn from(err: rusqlite::Error) -> Self {
        StorageError::Sqlite(err)
    }
}

impl fmt::Display for StorageError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            StorageError::Io(err) => write!(f, "IO Error: {}", err),
            StorageError::Sqlite(err) => write!(f, "SQLite Error: {}", err),
        }
    }
}

pub struct Storage {
    conn: Connection,
}

impl Storage {
    pub fn new(app_handle: &AppHandle) -> Result<Self, StorageError> {
        let data_dir = app_handle
            .path().app_data_dir()
            .expect("Failed to get app data dir");
        
        tracing::info!("Creating data directory: {:?}", data_dir);
        std::fs::create_dir_all(&data_dir)?;
        
        let db_path = data_dir.join("usage_stats.db");
        tracing::info!("Database path: {:?}", db_path);
        
        let conn = Connection::open(&db_path)?;
        tracing::info!("Database connection established");
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS app_usage (
                id INTEGER PRIMARY KEY,
                timestamp TEXT NOT NULL,
                app_name TEXT NOT NULL,
                duration INTEGER NOT NULL
            )",
            [],
        )?;
        tracing::info!("Database table created/verified");
        
        Ok(Self { conn })
    }
    
    pub fn record_usage(&self, record: AppUsageRecord) -> Result<(), StorageError> {
        tracing::info!("Recording usage for: {} at {}", record.app_name, record.timestamp);
        self.conn.execute(
            "INSERT INTO app_usage (timestamp, app_name, duration) VALUES (?1, ?2, ?3)",
            (
                record.timestamp.to_rfc3339(),
                &record.app_name,
                record.duration,
            ),
        )?;
        tracing::info!("Usage recorded successfully");
        Ok(())
    }
    
    pub fn get_usage_stats(&self, range: &str) -> Result<Vec<AppUsageStats>, StorageError> {
        let sql = match range {
            "daily" => "
                SELECT app_name, 
                       strftime('%Y-%m-%d', timestamp) as date,
                       SUM(duration) as daily_duration
                FROM app_usage 
                WHERE date(timestamp) = date('now', 'localtime')
                GROUP BY app_name, date
                ORDER BY daily_duration DESC
            ",
            "3days" => "
                SELECT app_name, 
                       strftime('%Y-%m-%d', timestamp) as date,
                       SUM(duration) as daily_duration
                FROM app_usage 
                WHERE timestamp >= datetime('now', '-3 days', 'localtime')
                GROUP BY app_name, date
                ORDER BY daily_duration DESC
            ",
            "weekly" => "
                SELECT app_name, 
                       strftime('%Y-%m-%d', timestamp) as date,
                       SUM(duration) as daily_duration
                FROM app_usage 
                WHERE timestamp >= datetime('now', '-7 days', 'localtime')
                GROUP BY app_name, date
                ORDER BY daily_duration DESC
            ",
            "monthly" => "
                SELECT app_name, 
                       strftime('%Y-%m-%d', timestamp) as date,
                       SUM(duration) as daily_duration
                FROM app_usage 
                WHERE timestamp >= datetime('now', '-30 days', 'localtime')
                GROUP BY app_name, date
                ORDER BY daily_duration DESC
            ",
            _ => "
                SELECT app_name, 
                       strftime('%Y-%m-%d', timestamp) as date,
                       SUM(duration) as daily_duration
                FROM app_usage 
                WHERE date(timestamp) = date('now', 'localtime')
                GROUP BY app_name, date
                ORDER BY daily_duration DESC
            ",
        };

        let mut stmt = self.conn.prepare(sql)?;
        let rows = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i64>(2)?,
            ))
        })?;
        
        // 组织数据
        let mut app_stats: HashMap<String, AppUsageStats> = HashMap::new();
        
        for row in rows {
            let (app_name, date_str, duration) = row?;
            let date = DateTime::parse_from_rfc3339(&format!("{}T00:00:00Z", date_str))
                .unwrap()
                .with_timezone(&Utc);
                
            app_stats.entry(app_name.clone())
                .or_insert_with(|| AppUsageStats {
                    name: app_name.clone(),
                    total_time: 0,
                    daily_usage: Vec::new(),
                })
                .daily_usage
                .push(DailyUsage {
                    date,
                    duration: duration as u64,
                });
        }
        
        // 计算总时长并排序
        let mut stats: Vec<AppUsageStats> = app_stats.into_values()
            .map(|mut stat| {
                stat.total_time = stat.daily_usage.iter()
                    .map(|d| d.duration)
                    .sum();
                stat
            })
            .collect();
            
        stats.sort_by(|a, b| b.total_time.cmp(&a.total_time));
        
        Ok(stats)
    }
}