CREATE OR REPLACE FUNCTION ppm_to_regex (regex_txt text, profile_txt text, nb_groups integer)
  RETURNS integer[]
AS $$
  import re
  regex = re.compile(regex_txt)
  match_res = regex.match(profile_txt)
  return [m for i in range(1, nb_groups + 1) for m in match_res.span(i)] if match_res else []
$$ LANGUAGE plpython3u;
