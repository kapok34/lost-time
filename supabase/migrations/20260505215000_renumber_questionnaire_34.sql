-- Renumber existing questionnaire answers to make room for new question 13.
-- We shift in descending order to avoid unique constraint conflicts.

UPDATE public.questionnaire_answers
SET question_id = 34
WHERE question_id = 33;

UPDATE public.questionnaire_answers
SET question_id = 33
WHERE question_id = 32;

UPDATE public.questionnaire_answers
SET question_id = 32
WHERE question_id = 31;

UPDATE public.questionnaire_answers
SET question_id = 31
WHERE question_id = 30;

UPDATE public.questionnaire_answers
SET question_id = 30
WHERE question_id = 29;

UPDATE public.questionnaire_answers
SET question_id = 29
WHERE question_id = 28;

UPDATE public.questionnaire_answers
SET question_id = 28
WHERE question_id = 27;

UPDATE public.questionnaire_answers
SET question_id = 27
WHERE question_id = 26;

UPDATE public.questionnaire_answers
SET question_id = 26
WHERE question_id = 25;

UPDATE public.questionnaire_answers
SET question_id = 25
WHERE question_id = 24;

UPDATE public.questionnaire_answers
SET question_id = 24
WHERE question_id = 23;

UPDATE public.questionnaire_answers
SET question_id = 23
WHERE question_id = 22;

UPDATE public.questionnaire_answers
SET question_id = 22
WHERE question_id = 21;

UPDATE public.questionnaire_answers
SET question_id = 21
WHERE question_id = 20;

UPDATE public.questionnaire_answers
SET question_id = 20
WHERE question_id = 19;

UPDATE public.questionnaire_answers
SET question_id = 19
WHERE question_id = 18;

UPDATE public.questionnaire_answers
SET question_id = 18
WHERE question_id = 17;

UPDATE public.questionnaire_answers
SET question_id = 17
WHERE question_id = 16;

UPDATE public.questionnaire_answers
SET question_id = 16
WHERE question_id = 15;

UPDATE public.questionnaire_answers
SET question_id = 15
WHERE question_id = 14;

UPDATE public.questionnaire_answers
SET question_id = 14
WHERE question_id = 13;
