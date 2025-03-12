DROP FUNCTION IF EXISTS ppm_to_regex;

DROP TYPE IF EXISTS regex_match_group;
CREATE TYPE regex_match_group AS (
  grp_id    integer,
  grp_start integer,
  grp_end   integer
);

CREATE FUNCTION ppm_to_regex(regex_txt text, profile_txt text)
  RETURNS SETOF regex_match_group
AS $$
  import re
  
  return [
    (grpNum, m.start(grpNum), m.end(grpNum))
    for m in re.finditer(regex_txt, profile_txt)
    for grpNum in range(1, len(m.groups()) + 1)
    if m.end(grpNum) > m.start(grpNum)
  ]
$$ LANGUAGE plpython3u;