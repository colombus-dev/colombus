CREATE OR REPLACE FUNCTION ppm_to_regex (regex_txt text, profile_txt text, nb_groups integer)
  RETURNS integer[]
AS $$
  import re
  return [s for m in re.finditer(regex_txt, profile_txt) for grpNum in range(1, len(m.groups()) + 1) for s in (m.start(grpNum), m.end(grpNum))]
$$ LANGUAGE plpython3u;