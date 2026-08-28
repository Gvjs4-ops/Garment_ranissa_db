"""
============================================================
Ranissa Tooling SDK
SQL Utilities
============================================================
"""

import re


# ============================================================
# COMMENTS
# ============================================================

LINE_COMMENT_RE = re.compile(r"--.*?$", re.MULTILINE)

BLOCK_COMMENT_RE = re.compile(
    r"/\*.*?\*/",
    re.DOTALL,
)


def strip_comments(sql: str) -> str:

    sql = BLOCK_COMMENT_RE.sub("", sql)

    sql = LINE_COMMENT_RE.sub("", sql)

    return sql


# ============================================================
# NORMALIZATION
# ============================================================

WHITESPACE_RE = re.compile(r"\s+")


def normalize(sql: str) -> str:

    sql = strip_comments(sql)

    sql = WHITESPACE_RE.sub(" ", sql)

    return sql.strip()


# ============================================================
# SPLIT STATEMENTS
# ============================================================

def split_statements(sql: str):

    statements = []

    current = []

    in_single = False

    in_double = False

    for ch in sql:

        if ch == "'" and not in_double:

            in_single = not in_single

        elif ch == '"' and not in_single:

            in_double = not in_double

        if ch == ";" and not in_single and not in_double:

            statement = "".join(current).strip()

            if statement:

                statements.append(statement)

            current = []

            continue

        current.append(ch)

    tail = "".join(current).strip()

    if tail:

        statements.append(tail)

    return statements


# ============================================================
# KEYWORDS
# ============================================================

def starts_with(statement: str, keyword: str):

    return normalize(statement).upper().startswith(
        keyword.upper()
    )


# ============================================================
# OBJECT DETECTION
# ============================================================

CREATE_TABLE_RE = re.compile(

    r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_.\"]+)",

    re.IGNORECASE,

)

ALTER_TABLE_RE = re.compile(

    r"ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_.\"]+)",

    re.IGNORECASE,

)

CREATE_FUNCTION_RE = re.compile(

    r"CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([a-zA-Z0-9_.\"]+)",

    re.IGNORECASE,

)

CREATE_INDEX_RE = re.compile(

    r"CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_.\"]+)",

    re.IGNORECASE,

)

CREATE_TRIGGER_RE = re.compile(

    r"CREATE\s+TRIGGER\s+([a-zA-Z0-9_.\"]+)",

    re.IGNORECASE,

)

CREATE_VIEW_RE = re.compile(

    r"CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+([a-zA-Z0-9_.\"]+)",

    re.IGNORECASE,

)

CREATE_TYPE_RE = re.compile(

    r"CREATE\s+TYPE\s+([a-zA-Z0-9_.\"]+)",

    re.IGNORECASE,

)


# ============================================================
# HELPERS
# ============================================================

def clean_identifier(name: str):

    return name.replace('"', "").strip()


def regex_find(regex, sql):

    results = []

    for match in regex.finditer(sql):

        results.append(

            clean_identifier(

                match.group(1)

            )

        )

    return results
